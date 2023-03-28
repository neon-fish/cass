import { Configuration, CreateChatCompletionResponse, OpenAIApi } from "openai";
import { inspect } from "util";
import { Settings } from "./settings";
import { Utils } from "./utils";

const SYSTEM_MESSAGE = `You are a virtual assistant called Cass. You are very friendly and helpful. You can generate code and terminal commands, answer general questions, generate text, and help the user with their work.`;
/** Estimate */
const CHARS_PER_TOKEN = 4;

export async function respondToChat(message: string, opts?: {
  verbose?: boolean,
  stream?: boolean,
  dryRun?: boolean,
  tokens?: number,
}): Promise<CreateChatCompletionResponse | string> {

  const verbose = Boolean(opts?.verbose);
  const stream = Boolean(opts?.stream);
  const dryRun = Boolean(opts?.dryRun);
  const tokens: number | undefined = opts?.tokens;

  if (!message) {
    return "No prompt";
  }

  const apiKey = Utils.apiKey();
  if (!apiKey) {
    return `No API key!\nSee: https://platform.openai.com/docs/api-reference/authentication \nThen set the key using:\n$ cass --api-key=<your-new-api-key>`;
  }

  const configuration = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(configuration);

  const model = Settings.settings.model;
  const temperature = Settings.settings.temperature;
  const maxResponseTokens = tokens ?? Settings.settings.responseTokensMax;

  const totalTokens = Settings.settings.totalTokens;
  const systemTokens = (SYSTEM_MESSAGE.length / CHARS_PER_TOKEN) * 1.2; // overestimate
  const messageTokens = (message.length / CHARS_PER_TOKEN) * 1.2; // overestimate
  const historyTokensAvailable = totalTokens - (maxResponseTokens + systemTokens + messageTokens);
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
      `SYSTEM: ${SYSTEM_MESSAGE}`,
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
      { role: "system", content: SYSTEM_MESSAGE },
      ...latesthistory,
      { role: "user", content: message },
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
      { role: "user", content: message },
      { role: "assistant", content: responseMessage },
    ]);
  }

  return response.data;

}
