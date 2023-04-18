import chalk from "chalk";
import ora from "ora";
import { Logger } from "../core/logger";
import { Utils } from "../core/utils";
import { CliConfig } from "./input";

export async function doDryRun(prompt: string, opts: CliConfig) {

  const spinner = ora({
    text: chalk.greenBright("thinking (dry run)..."),
    color: "green",
  }).start();

  await Utils.wait(2_000);

  spinner.stop();
  Logger.system(`> [dry run complete]`);

}
