#!/usr/bin/env node

import chalk from "chalk";
import * as dotenv from "dotenv";
import ora from "ora";
import { inspect } from "util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { respondToChat } from "../core/chat";
import { completePrompt } from "../core/complete";
import { Utils } from "../core/utils";

dotenv.config();

async function cli() {
  
  const argv = await yargs(hideBin(process.argv)).argv;
  
  const prompt = argv._.map(p => p.toString().trim()).join(" ");
  const helpF = Utils.argIsTrue(argv["help"] || argv["h"]);
  const verboseF = Utils.argIsTrue(argv["verbose"] || argv["v"]);
  const modelsF = Utils.argIsTrue(argv["model"] || argv["models"] || argv["m"]);
  
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
    );
  }

  console.log("");
  console.log(chalk.cyanBright(`> ${prompt}`));
  console.log("");

  const spinner = ora({
    text: chalk.greenBright("thinking..."),
    color: "green",
  }).start();

  // const resultP = completePrompt(prompt, { verbose: verboseF });
  const resultP = respondToChat(prompt, { verbose: verboseF });

  const result = await resultP.catch(err => {
    spinner.stop();
    console.log(chalk.redBright(`> Error generating response:`, err));
    return undefined
  });
  spinner.stop();
  
  if (result) {
    const { choices, created, id, model, object, usage } = result;
    // const resultText = choices[0].text?.trim();
    const resultText = choices[0].message?.content.trim();
    console.log(chalk.greenBright(`> ${resultText}`));
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
