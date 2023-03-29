#!/usr/bin/env node

import chalk from "chalk";
import * as dotenv from "dotenv";
import { CreateChatCompletionResponse } from "openai";
import ora from "ora";
import { inspect } from "util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { respondToChat } from "../core/chat";
import { Utils } from "../core/utils";

dotenv.config();

const argsParser = yargs(hideBin(process.argv))
  .usage(`USAGE:\nSimply type a question or instruction. Wrap the input in quotes if the prompt contains special characters. Example:\n$ cass tell me a joke about programming\n\nTo insert text from the clipboard, use one of the placeholders. Example:\n$ cass "what's wrong with this function: <clipboard>"`)
  .boolean("verbose")
  .alias("v", "verbose")
  .describe("verbose", "Show verbose information for debugging")
  .boolean("cassdir")
  .alias("cassdir", "cass-dir")
  .describe("cassdir", "Open the Cass config dir in file explorer")
  .boolean("dry")
  .alias("dry", "dry-run")
  .describe("dry", "Do not send a request to the API")
  .boolean("clear")
  .alias("cls", "clear")
  .describe("clear", "Archive the recent history")
  .alias("key", "api-key")
  .describe("api-key", "Use and store the OpenAI API key")
  .alias("t", "tokens")
  .describe("tokens", "Specify the maximum number of tokens to use in the response")
  .boolean("update")
  .alias("up", "update")
  .describe("update", "Update the globally-installed NPM package")
  .boolean("upgrade")
  .describe("upgrade", "Alias for 'update'")
  .help('h').alias('h', 'help')
  .epilog('(https://github.com/neon-fish/cass)')
  ;

async function cli() {

  const argv = await argsParser.argv;

  let prompt = argv._.map(p => p.toString().trim()).join(" ");
  const verboseF = Boolean(argv.verbose);
  const modelsF = Utils.argIsTrue(argv["model"] || argv["models"] || argv["m"]);
  const cassDirF = Boolean(argv.cassDir);
  const dryRunF = Boolean(argv.dryRun);
  const clearF = Boolean(argv.clear);
  const apiKey = argv.apiKey?.toString() ? argv.apiKey.toString() : undefined;
  const tokens = argv.tokens?.toString() ? Number(argv.tokens.toString()) : undefined;
  const updateF = Boolean(argv.update);

  prompt = Utils.insertClipboardText(prompt);

  if (verboseF) {
    Utils.logVerboseLines(
      "",
      "CASS:",
      "",
      `ARGV: ${inspect(argv)}`,
      `PROMPT: "${prompt}"`,
      `API KEY: "${apiKey}"`,
      `TOKENS: "${tokens}"`,
      `🚩 VERBOSE: ${verboseF}`,
      `🚩 MODELS: ${modelsF}`,
      `🚩 CASS DIR: ${cassDirF}`,
      `🚩 DRY RUN: ${dryRunF}`,
      `🚩 CLEAR: ${clearF}`,
      `🚩 UPDATE: ${updateF}`,
    );
  }

  if (updateF) {
    const updated = await Utils.update();
    // console.log(chalk.gray("(opening Cass dir)"));
    if (updated) return;
  }
  if (cassDirF) {
    Utils.openCassDir();
    console.log(chalk.gray("(opening Cass dir)"));
  }
  if (clearF) {
    Utils.clearHistory();
    console.log(chalk.gray("(cleared history)"));
  }
  if (apiKey) {
    Utils.storeApiKey(apiKey);
    console.log(chalk.gray("(stored API key)"));
  }

  console.log("");
  console.log(chalk.cyanBright(`> ${prompt}`));
  console.log("");

  const spinnerText = dryRunF ? "thinking (dry run)..." : "thinking...";
  const spinner = ora({
    text: chalk.greenBright(spinnerText),
    color: "green",
  }).start();

  let resultPromise: Promise<CreateChatCompletionResponse | string | undefined | void>;
  if (dryRunF) {
    resultPromise = Utils.wait(3_000);
  } else {
    // resultPromise = completePrompt(prompt, { verbose: verboseF });
    resultPromise = respondToChat(prompt, {
      verbose: verboseF,
      tokens: tokens,
    });
  }

  const result = await resultPromise.catch(err => {
    spinner.stop();
    console.log(chalk.redBright(`> Error generating response:`, err));
    return undefined
  });
  spinner.stop();

  if (result) {
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

  if (dryRunF) {
    console.log(chalk.greenBright(`> [dry run complete]`));
  }

  if (verboseF) {
    Utils.logVerboseLines(
      "",
      "/CASS",
      "",
    );
  }

}

cli();
