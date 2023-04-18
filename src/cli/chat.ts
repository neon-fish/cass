import chalk from "chalk";
import { CreateChatCompletionResponse } from "openai";
import ora from "ora";
import { respondToChat } from "../core/chat";
import { Logger } from "../core/logger";
import { runWebSearch } from "../core/tools/web-search";
import { webpageSummary } from "../core/tools/webpage-summary";
import { doImage } from "./image";
import { CliConfig } from "./input";

export async function doChat(prompt: string, config: CliConfig) {

  if (!prompt) {
    return Logger.system(`> No prompt`);
  }

  let pendingAction = true;
  while (pendingAction) {
    pendingAction = false;

    const spinner = ora({
      text: chalk.greenBright("thinking..."),
      color: "green",
    }).start();

    const chatResultPromise: Promise<CreateChatCompletionResponse> = respondToChat(prompt, {
      verbose: config.verbose,
      tokens: config.tokens,
      useGpt3: config.gpt3,
      useGpt4: config.gpt4,
    });

    const chatResponse = await chatResultPromise.catch(err => {
      spinner.stop();
      Logger.error(`> Error generating response:`, err);
      return undefined;
    });
    spinner.stop();

    if (!chatResponse) return;

    const { choices, created, id, model, object, usage } = chatResponse;
    const chatText = choices[0].message?.content.trim() ?? "";

    Logger.cass(`> ${chatText}`);
    Logger.cass("");

    // If the result is a tool instruction, use the tool, and return the result

    // SEARCH
    const searchLine = chatText.split("\n").find(line => line.startsWith("SEARCH"));
    if (searchLine && !pendingAction) {
      pendingAction = true;

      let query = searchLine.replace("SEARCH", "");
      if (query.startsWith(":")) {
        query = query.replace(":", "");
      }
      query = query.trim();

      const searchResult = await runWebSearch(query, {
        resultsCount: 10,
        verbose: config.verbose,
      });

      prompt = `Search result: ${JSON.stringify(searchResult)}`;
    }

    // WEBPAGE
    const webpageLine = chatText.split("\n").find(line => line.startsWith("WEBPAGE"));
    if (webpageLine && !pendingAction) {
      pendingAction = true;

      let url = webpageLine.replace("WEBPAGE", "");
      if (url.startsWith(":")) {
        url = url.replace(":", "");
      }
      url = url.trim();

      const summary = await webpageSummary(url, {
        verbose: config.verbose,
      });

      prompt = `Summary of webpage at "${url}": ${JSON.stringify(summary)}`
    }

    // IMAGE
    const imageLine = chatText.split("\n").find(line => line.startsWith("IMAGE"));
    if (imageLine && !pendingAction) {
      // pendingAction = true;

      let imagePrompt = imageLine.replace("IMAGE", "");
      if (imagePrompt.startsWith(":")) {
        imagePrompt = imagePrompt.replace(":", "");
      }
      imagePrompt = imagePrompt.trim();

      const imageResult = await doImage(imagePrompt, config);

      // prompt = imageResult
      //   ? `[Image generated successfully]`
      //   : `[Error generating image]`;
    }

    // If a tool has written results to the prompt, the while loop will not exit
  }

}
