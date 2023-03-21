#!/usr/bin/env node

import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Utils } from "../core/utils";
import ora from "ora";
import { doAIShit } from "../core/core";
import { inspect } from "util";

async function cli() {
  
  const argv = await yargs(hideBin(process.argv)).argv;
  
  const prompt = argv._.map(p => p.toString().trim()).join(" ");
  const flagHelp = Utils.argIsTrue(argv["help"] || argv["h"]);
  const flagVerbose = Utils.argIsTrue(argv["verbose"] || argv["v"]);
  
  if (flagVerbose) {
    Utils.logVerboseLines(
      "",
      "CASS:",
      "",
      `ARGV: ${inspect(argv)}`,
      `PROMPT: "${prompt}"`,
      `🚩 HELP: ${flagHelp}`,
      `🚩 VERBOSE: ${flagHelp}`,
    );
  }

  console.log("");
  console.log(chalk.cyanBright(`> ${prompt}`));
  console.log("");

  const spinner = ora({
    text: chalk.greenBright("thinking..."),
    color: "green",
  }).start();

  let failed = false;
  const result = await doAIShit({
    prompt,
    verbose: flagVerbose,
  }).then(res => {
    spinner.stop();
    return res;
  }).catch(err => {
    spinner.stop();
    console.log(chalk.redBright(`> Error generating response:`, err));
    failed = true;
    return undefined
  });
  
  if (!failed && result) {
    const { choices, created, id, model, object, usage } = result;
    const resultText = choices[0].text?.trim();
    console.log(chalk.greenBright(`> ${resultText}`));
  }

  if (flagVerbose) {
    Utils.logVerboseLines(
      "",
      "/CASS",
      "",
    );
  }

}

cli();
