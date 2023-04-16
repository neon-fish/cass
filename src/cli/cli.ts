#!/usr/bin/env node

import chalk from "chalk";
import * as dotenv from "dotenv";
import { CreateChatCompletionResponse, ImagesResponse } from "openai";
import ora from "ora";
import { inspect } from "util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { respondToChat } from "../core/chat";
import { generateImage } from "../core/image";
import { Utils } from "../core/utils";
import { runWebSearch } from "../core/tools/web-search";
import { webpageSummary } from "../core/tools/webpage-summary";
import { Settings } from "../core/settings";

dotenv.config();

const argsParser = yargs(hideBin(process.argv))
  .usage(`USAGE:\nSimply type a question or instruction. Wrap the input in quotes if the prompt contains special characters. Example:\n$ cass tell me a joke about programming\n\nTo insert text from the clipboard, use one of the placeholders. Example:\n$ cass "what's wrong with this function: <clipboard>"`)
  .help('h').alias('h', 'help')
  .option("image", {
    boolean: true,
    alias: ["img", "i"],
    describe: "Use the prompt to generate an image instead of a chat message",
  })
  .option("count", {
    alias: ["n"],
    describe: "Specify how many images to generate",
  })
  .option("verbose", {
    boolean: true,
    alias: "v",
    describe: "Show verbose information for debugging",
  })
  .option("dir", {
    boolean: true,
    alias: "cass-dir",
    describe: "Open the Cass config dir in file explorer",
  })
  .option("dry", {
    boolean: true,
    alias: "dry-run",
    describe: "Do not send a request to the API",
  })
  .option("clear", {
    boolean: true,
    alias: ["cls", "c"],
    describe: "Archive the recent history",
  })
  .option("api-key", {
    alias: "key",
    describe: "Use and store the given OpenAI API key",
  })
  .option("tokens", {
    alias: "t",
    describe: "Specify the maximum number of tokens to use in the response",
  })
  .option("up", {
    boolean: true,
    alias: ["update", "upgrade"],
    describe: "Update the globally-installed NPM package",
  })
  .option("gpt3", {
    boolean: true,
    alias: "3",
    describe: "Force the use of GPT 3.5 Turbo for this prompt",
  })
  .option("gpt4", {
    boolean: true,
    alias: "4",
    describe: "Force the use of GPT 4 for this prompt",
  })
  .option("user-name", {
    alias: "user",
    describe: "Update the name of the user",
  })
  .option("user-location", {
    alias: "user",
    describe: `Update the approximate location of the user ("auto" to find by IP)`,
  })
  .epilog('(https://github.com/neon-fish/cass)')
  ;

interface CliConfig {
  verbose: boolean,
  // models: boolean,
  cassDir: boolean,
  dryRun: boolean,
  clear: boolean,
  apiKey: string | undefined,
  tokens: number | undefined,
  update: boolean,
  gpt3: boolean,
  gpt4: boolean,
  image: boolean,
  imageCount: number | undefined,
  userName: string | undefined,
  userLocation: string | undefined,
}

async function cli() {

  const argv = await argsParser.argv;

  let prompt = argv._.map(p => p.toString().trim()).join(" ");

  const cliConfig: CliConfig = {
    verbose: Boolean(argv.verbose),
    cassDir: Boolean(argv.cassDir),
    dryRun: Boolean(argv.dryRun),
    clear: Boolean(argv.clear),
    apiKey: argv.apiKey?.toString() ? argv.apiKey.toString() : undefined,
    tokens: argv.tokens?.toString() ? Number(argv.tokens.toString()) : undefined,
    update: Boolean(argv.update),
    gpt3: Boolean(argv.gpt3),
    gpt4: Boolean(argv.gpt4),
    image: Boolean(argv.image),
    imageCount: argv.count?.toString() ? Number(argv.count.toString()) : undefined,
    userName: argv.userName?.toString() ? argv.userName.toString() : undefined,
    userLocation: argv.userLocation?.toString() ? argv.userLocation.toString() : undefined,
  };

  prompt = Utils.insertClipboardText(prompt);

  if (argv.test) {
    return await runTest(prompt, cliConfig, argv);
  }

  if (cliConfig.verbose) {
    Utils.logVerboseLines(
      "",
      "CASS:",
      "",
      `ARGV: ${inspect(argv)}`,
      `PROMPT: "${prompt}"`,
      `API KEY: "${cliConfig.apiKey}"`,
      `TOKENS: ${cliConfig.tokens}`,
      `IMAGES: ${cliConfig.imageCount}`,
      `🚩 IMAGE: ${cliConfig.image}`,
      `🚩 VERBOSE: ${cliConfig.verbose}`,
      `🚩 CASS DIR: ${cliConfig.cassDir}`,
      `🚩 DRY RUN: ${cliConfig.dryRun}`,
      `🚩 CLEAR: ${cliConfig.clear}`,
      `🚩 UPDATE: ${cliConfig.update}`,
      `🚩 GPT 3: ${cliConfig.gpt3}`,
      `🚩 GPT 4: ${cliConfig.gpt4}`,
    );
  }

  if (cliConfig.update) {
    const updated = await Utils.update();
    // console.log(chalk.gray("(opening Cass dir)"));
    if (updated) return;
  }
  if (cliConfig.cassDir) {
    Utils.openCassDir();
    console.log(chalk.gray("(opening Cass dir)"));
  }
  if (cliConfig.clear) {
    Utils.clearHistory();
    console.log(chalk.gray("(cleared history)"));
  }
  if (cliConfig.apiKey) {
    Utils.storeApiKey(cliConfig.apiKey);
    console.log(chalk.gray("(stored API key)"));
  }
  if (cliConfig.userName) {
    Settings.settings.userName = cliConfig.userName;
    Settings.save();
    console.log(chalk.gray("(saved user name)"));
  }
  if (cliConfig.userLocation) {
    if (cliConfig.userLocation === "auto") {
      // TODO
    } else {
      Settings.settings.userLocation = cliConfig.userLocation;
    }
    Settings.save();
    console.log(chalk.gray("(saved user location)"));
  }

  console.log("");

  console.log(chalk.cyanBright(`> ${prompt}`));
  console.log("");

  if (cliConfig.dryRun) {
    await doDryRun(prompt, cliConfig);
  } else if (cliConfig.image) {
    await doImage(prompt, cliConfig);
  } else {
    await doChat(prompt, cliConfig);
  }

  if (cliConfig.verbose) {
    Utils.logVerboseLines(
      "",
      "/CASS",
      "",
    );
  }

}

cli();

async function doDryRun(prompt: string, opts: CliConfig) {

  const spinner = ora({
    text: chalk.greenBright("thinking (dry run)..."),
    color: "green",
  }).start();

  await Utils.wait(2_000);

  spinner.stop();
  console.log(chalk.greenBright(`> [dry run complete]`));

}

async function doChat(prompt: string, config: CliConfig) {

  if (!prompt) {
    return console.log(chalk.greenBright(`> No prompt`));
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
      console.log(chalk.redBright(`> Error generating response:`, err));
      return undefined;
    });
    spinner.stop();

    if (!chatResponse) return;

    const { choices, created, id, model, object, usage } = chatResponse;
    const chatText = choices[0].message?.content.trim() ?? "";

    console.log(chalk.greenBright(`> ${chatText}`));
    console.log("");

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

async function doImage(prompt: string, config: CliConfig): Promise<boolean> {

  const spinnerText = "thinking...";
  const spinner = ora({
    text: chalk.greenBright(spinnerText),
    color: "green",
  }).start();

  const resultPromise: Promise<string | ImagesResponse> = generateImage(prompt, {
    verbose: config.verbose,
    n: config.imageCount,
  });

  const result = await resultPromise.catch(err => {
    spinner.stop();
    console.log(chalk.redBright(`> Error generating image(s):`, err));
    return undefined;
  });
  spinner.stop();

  if (!result) return false;

  let resultText = "";
  if (typeof result === "string") {
    resultText = result;
  } else {
    const s = result.data.length === 1 ? "" : "s";
    resultText = `Saved ${result.data.length} new image${s} to Cass directory (\`cass --dir\`)`;
  }
  console.log(chalk.greenBright(`> ${resultText}`));

  return true;
}

async function runTest(prompt: string, cliConfig: CliConfig, argv: any) {

  // openUrl("https%3A%2F%2Fwww.freecodecamp.org%2Fnews%2Fthe%2Dultimate%2Dguide%2Dto%2Dweb%2Dscraping%2Dwith%2Dnode%2Djs%2Ddaa2027dcd3%2F");
  const page = await webpageSummary("https://neon.fish", {
    verbose: cliConfig.verbose,
  });
  
  // runWebSearch("jack russels in norfolk", {
  //   resultsCount: 10,
  //   verbose: true,
  // });

}
