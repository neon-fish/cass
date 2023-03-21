import { Configuration, OpenAIApi } from "openai";
import { inspect } from "util";
import { Utils } from "./utils";

const SYSTEM_MESSAGE = `You are a virtual assistant called Cass. You are friendly and helpful. You can generate code and terminal commands, answer questions, generate text, and help the user with their work.`;

export async function respondToChat(message: string, opts?: {
  verbose?: boolean,
}) {

  const verbose = Boolean(opts?.verbose);
  if (!message) {
    throw new Error("No message provided");
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const temperature = 0.5;
  const maxTokens = 2048;

  if (verbose) {
    Utils.logVerboseLines(
      "",
      `API KEY: ${process.env.OPENAI_API_KEY}`,
      `TEMPERATURE: ${temperature}`,
      `MAX TOKENS: ${maxTokens}`,
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

  return response.data;

}
// doAIShit();
