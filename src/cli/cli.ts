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

async function cli() {
  
  const argv = await yargs(hideBin(process.argv)).argv;
  
  const prompt = argv._.map(p => p.toString().trim()).join(" ");
  const helpF = Utils.argIsTrue(argv["help"] || argv["h"]);
  const verboseF = Utils.argIsTrue(argv["verbose"] || argv["v"]);
  const modelsF = Utils.argIsTrue(argv["model"] || argv["models"] || argv["m"]);
  const cassDirF = Utils.argIsTrue(argv["cassDir"] || argv["cassdir"] || argv["cass-dir"]);
  const dryRunF = Utils.argIsTrue(argv["dryRun"] || argv["dry"]);
  const clearF = Utils.argIsTrue(argv["clear"] || argv["cls"]);
  
  if (verboseF) {
    Utils.logVerboseLines(
      "",
      "CASS:",
      "",
      `ARGV: ${inspect(argv)}`,
      `PROMPT: "${prompt}"`,
      `🚩 HELP: ${helpF}`,
      `🚩 VERBOSE: ${verboseF}`,
      `🚩 MODELS: ${modelsF}`,
      `🚩 CASS DIR: ${cassDirF}`,
      `🚩 DRY RUN: ${dryRunF}`,
      `🚩 CLEAR: ${clearF}`,
    );
  }

  console.log("");
  console.log(chalk.cyanBright(`> ${prompt}`));
  console.log("");

  if (cassDirF) Utils.openCassDir();
  if (clearF) Utils.clearHistory();

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
    resultPromise = respondToChat(prompt, { verbose: verboseF });

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
