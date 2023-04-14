import { Configuration, CreateChatCompletionResponse, OpenAIApi } from "openai";
import { inspect } from "util";
import { Settings } from "./settings";
import { Utils } from "./utils";

const DEFAULT_SYSTEM_MESSAGE = `
You are a virtual assistant called Cass. You are very friendly and helpful.
You can generate code and terminal commands, answer general questions, generate text, and help the user with their work.
You can also perform simple web searches, and read text from web pages.

Special Responses:

If the user asks something that you don't know, or that requires current information to answer correctly,
or if a query relates to events or developments that may have happened after September 2021,
then respond with a "SEARCH" response.
A "SEARCH" response begins with "SEARCH" in uppercase, then the rest of the response is a query that will
be passed to a search engine. The query should not be wrapped in quotation marks unless if that exact string should be searched for.
The result of the search will be sent as the next User message as JSON, which may then be used to
complete the user's query or instruction, if the results are relevant.

If you need to read a web page at a particular URL to help respond to a query, respond with a "WEBPAGE" response.
A "WEBPAGE" response begins with "WEBPAGE" in uppercase, then a space, then the rest of the line is the URL of
the webpage to be read. The text content of the webpage at the target URL is then returned as the next user message,
if the webpage can be parsed.

If the user instructs you to generate an image, respond with an "IMAGE" response.
An "IMAGE" response begins with "IMAGE" in uppercase, then a space, then the rest of the line is a visual description
of the image to generate. The description should describe the subject(s), the background, the artistic medium,
additional descriptive adjectives to modify the generated image, and optionally names of artists to use their artistic style.
Image descriptions should not include more than a handful of subjects, should not specify that any text appear in the image,
and should not specify relative positions of subjects.
If the user's request was not very specific, add some details to make the description more appealing.
If the user asks for something similar like a painting or drawing, create an image but include the medium in the "IMAGE" response.

The only types of "special" response are: SEARCH, WEBPAGE, IMAGE
`;

/** Estimate */
const CHARS_PER_TOKEN = 4;

/**
 * 
 * @param prompt 
 * @param opts 
 * @returns 
 * @throws Error on error
 */
export async function respondToChat(prompt: string, opts?: {
  verbose?: boolean,
  stream?: boolean,
  dryRun?: boolean,
  tokens?: number,
  useGpt3?: boolean,
  useGpt4?: boolean,
}): Promise<CreateChatCompletionResponse> {

  const verbose = Boolean(opts?.verbose);
  const stream = Boolean(opts?.stream);
  const dryRun = Boolean(opts?.dryRun);
  const tokens: number | undefined = opts?.tokens;

  const apiKey = Utils.apiKey();
  if (!apiKey) {
    throw new Error(`No API key!\nSee: https://platform.openai.com/docs/api-reference/authentication \nThen set the key using:\n$ cass --api-key=<your-new-api-key>`);
  }

  const configuration = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(configuration);

  const systemUserName = Settings.settings.userName
    ? `The user's name is: ${Settings.settings.userName}.`
    : "";
  const systemMessage = [
    DEFAULT_SYSTEM_MESSAGE,
    "Additional Information:",
    systemUserName,
    `The current time is: ${new Date().toISOString()}.`,
  ].join("\n\n");

  const model: "gpt-3.5-turbo" | "gpt-4" = opts?.useGpt4 === true ? "gpt-4" :
    opts?.useGpt3 === true ? "gpt-3.5-turbo" :
      Settings.settings.model;

  const temperature = Settings.settings.temperature;
  const maxResponseTokens = tokens ?? Settings.settings.responseTokensMax;

  const totalTokens = Settings.settings.totalTokens;
  const systemTokens = (systemMessage.length / CHARS_PER_TOKEN) * 1.2; // overestimate
  const promptTokens = (prompt.length / CHARS_PER_TOKEN) * 1.2; // overestimate
  const historyTokensAvailable = totalTokens - (maxResponseTokens + systemTokens + promptTokens);
  const historyTokens = Math.min(historyTokensAvailable, Settings.settings.historyTokensMax);
  const historyCharacters = (historyTokens * CHARS_PER_TOKEN) * 0.8; // underestimate

  const allHistory = Utils.readHistory();
  const latesthistory = Utils.getLatestHistory(allHistory, historyCharacters);

  if (verbose) {
    Utils.logVerboseLines(
      "",
      `API KEY: ${apiKey}`,
      `MODEL: ${model}`,
      `TEMPERATURE: ${temperature}`,
      `MAX TOKENS: ${maxResponseTokens}`,
      `SYSTEM: ${systemMessage}`,
      `TOTAL HISTORY: ${allHistory.length} messages (${allHistory.reduce((prev, curr, index) => prev + curr.content.length, 0)} characters)`,
      `LATEST HISTORY: ${latesthistory.length} messages (${latesthistory.reduce((prev, curr, index) => prev + curr.content.length, 0)} characters)`,
      "",
    );
  }

  const response = await openai.createChatCompletion({
    model: model,
    temperature: temperature,
    max_tokens: maxResponseTokens,
    // stream: true, //stream,
    messages: [
      { role: "system", content: systemMessage },
      ...latesthistory,
      { role: "user", content: prompt },
    ],
  });

  if (verbose) {
    Utils.logVerboseLines(
      "",
      "RESULT:",
      inspect(response.data.choices),
      "",
      "USAGE:",
      inspect(response.data.usage),
      "",
    );
  }

  const responseMessage = response.data.choices[0].message?.content;
  if (responseMessage) {
    Utils.addToHistory([
      { role: "user", content: prompt },
      { role: "assistant", content: responseMessage },
    ]);
  }

  return response.data;

}
