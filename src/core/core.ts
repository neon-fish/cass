import { Configuration, OpenAIApi } from "openai";
import * as dotenv from "dotenv";
import { Utils } from "./utils";
import { inspect } from "util";

dotenv.config();

const PROMPT_PREFIX = `You are a virtual assistant called Cass. You are friendly and helpful. You can generate code and terminal commands, answer questions, generate text, and help with the user's work.

USER: `;
const PROMPT_SUFFIX = `

CASS: `;

export async function doAIShit(settings: {
  prompt: string,
  verbose?: boolean,
}) {

  const { prompt, verbose } = settings;
  if (!prompt) {
    throw new Error("No prompt provided");
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const temperature = 0.5;
  const maxTokens = 2048;
  const fullPrompt = PROMPT_PREFIX + prompt + PROMPT_SUFFIX;
  if (verbose) {
    Utils.logVerboseLines(
      "",
      `TEMPERATURE: ${temperature}`,
      `MAX TOKENS: ${maxTokens}`,
      `PROMPT: ${fullPrompt}`,
      "",
    );
  }

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: fullPrompt,
    temperature: temperature,
    max_tokens: maxTokens,
  });

  if (verbose) {
    Utils.logVerboseLines(
      "",
      "Result:",
      inspect(response.data.choices),
      "",
    );
  }

  return response.data;

}
// doAIShit();
