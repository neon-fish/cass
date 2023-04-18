#!/usr/bin/env node

import * as dotenv from "dotenv";
import { inspect } from "util";
import { Logger } from "../core/logger";
import { Settings } from "../core/settings";
import { webpageSummary } from "../core/tools/webpage-summary";
import { Utils } from "../core/utils";
import { doChat } from "./chat";
import { doDryRun } from "./dry-run";
import { doImage } from "./image";
import { CliConfig, parseCliInput } from "./input";

dotenv.config();

async function cli() {

  const { prompt, cliConfig, argv } = await parseCliInput();

  if (argv.test) {
    return await runTest(prompt, cliConfig, argv);
  }

  if (cliConfig.verbose) {
    Logger.verboseLines(
      "",
      "CASS:",
      "",
      `ARGV: ${inspect(argv)}`,
      `PROMPT: "${prompt}"`,
      `API KEY: "${cliConfig.apiKey}"`,
      `TOKENS: ${cliConfig.tokens}`,
      `IMAGES: ${cliConfig.imageCount}`,
      `🚩 UI: ${cliConfig.ui}`,
      `🚩 SERVE: ${cliConfig.serve}`,
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
    if (updated) return;
  }
  if (cliConfig.cassDir) {
    Utils.openCassDir();
    Logger.aside("Opening Cass dir");
  }
  if (cliConfig.clear) {
    Utils.clearHistory();
    Logger.aside("Cleared history");
  }
  if (cliConfig.apiKey) {
    Utils.storeApiKey(cliConfig.apiKey);
    Logger.aside("Stored API key");
  }
  if (cliConfig.userName) {
    Settings.settings.userName = cliConfig.userName;
    Settings.save();
    Logger.aside("Saved user name");
  }
  if (cliConfig.userLocation) {
    if (cliConfig.userLocation === "auto") {
      Settings.settings.userLocation = await Utils.findLocationFromIp();
    } else {
      Settings.settings.userLocation = cliConfig.userLocation;
    }
    Settings.save();
    Logger.aside("Saved user location");
  }

  // Do these last as they return
  if (cliConfig.ui) {
    await Utils.openUrl(`http://localhost:3155`);
    Logger.aside("Opened web UI");
  }
  if (cliConfig.ui || cliConfig.serve) {
    Logger.aside("Starting web server");
    require("../server/server");
  }
  if (cliConfig.ui || cliConfig.serve) {
    return;
  }

  Logger.user("");
  Logger.user(`> ${prompt}`);
  Logger.user("");

  if (cliConfig.dryRun) {
    await doDryRun(prompt, cliConfig);
  } else if (cliConfig.image) {
    await doImage(prompt, cliConfig);
  } else {
    await doChat(prompt, cliConfig);
  }

  if (cliConfig.verbose) {
    Logger.verboseLines(
      "",
      "/CASS",
      "",
    );
  }

}

cli();


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
