import { Configuration, OpenAIApi } from "openai";
import { inspect } from "util";
import { Utils } from "./utils";

const SYSTEM_MESSAGE = `You are a virtual assistant called Cass. You are friendly and helpful. You can generate code and terminal commands, answer questions, generate text, and help the user with their work.`;

export async function respondToChat(message: string, opts?: {
  verbose?: boolean,
}) {

  const verbose = Boolean(opts?.verbose);
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

  const temperature = 0.5;
  const maxTokens = 2048;

  const totalTokens = 4096;
  const systemTokens = SYSTEM_MESSAGE.length / 3; // over estimate
  const messageTokens = message.length / 3; // over estimate
  const historyTokens = totalTokens - (maxTokens + systemTokens + messageTokens);
  const historyCharacters = historyTokens * 4;

  const history = Utils.getLatestHistory(Utils.readHistory(), historyCharacters);

  if (verbose) {
    Utils.logVerboseLines(
      "",
      `API KEY: ${apiKey}`,
      `TEMPERATURE: ${temperature}`,
      `MAX TOKENS: ${maxTokens}`,
      `HISTORY: ${history.length} messages`,
      `SYSTEM: ${SYSTEM_MESSAGE}`,
      "",
    );
  }

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: SYSTEM_MESSAGE },
      ...history,
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
