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
    alias: "cls",
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
}

async function cli() {

  const argv = await argsParser.argv;

  let prompt = argv._.map(p => p.toString().trim()).join(" ");

  const cliConfig: CliConfig = {
    verbose: Boolean(argv.verbose),
    // models: Utils.argIsTrue(argv["model"] || argv["models"] || argv["m"]),
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
  };

  prompt = Utils.insertClipboardText(prompt);

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
      // `🚩 MODELS: ${cliConfig.models}`,
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

  const spinner = ora({
    text: chalk.greenBright("thinking..."),
    color: "green",
  }).start();

  const resultPromise: Promise<string | CreateChatCompletionResponse> = respondToChat(prompt, {
    verbose: config.verbose,
    tokens: config.tokens,
    useGpt3: config.gpt3,
    useGpt4: config.gpt4,
  });

  const result = await resultPromise.catch(err => {
    spinner.stop();
    console.log(chalk.redBright(`> Error generating response:`, err));
    return undefined;
  });
  spinner.stop();

  if (!result) return;

  let resultText = "";
  if (typeof result === "string") {
    resultText = result;
  } else {
    const { choices, created, id, model, object, usage } = result;
    // const resultText = choices[0].text?.trim();
    resultText = choices[0].message?.content.trim() ?? resultText;
  }
  console.log(chalk.greenBright(`> ${resultText}`));

}

async function doImage(prompt: string, config: CliConfig) {

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

  if (!result) return;

  let resultText = "";
  if (typeof result === "string") {
    resultText = result;
  } else {
    const s = result.data.length === 1 ? "" : "s";
    resultText = `Saved ${result.data.length} new image${s} to Cass directory (\`cass --dir\`)`;
  }
  console.log(chalk.greenBright(`> ${resultText}`));

}
