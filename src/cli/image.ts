import chalk from "chalk";
import { ImagesResponse } from "openai";
import ora from "ora";
import { generateImage } from "../core/image";
import { Logger } from "../core/logger";
import { CliConfig } from "./input";

export async function doImage(prompt: string, config: CliConfig): Promise<boolean> {

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
    Logger.error(`> Error generating image(s):`, err);
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
  Logger.system(`> ${resultText}`);

  return true;
}