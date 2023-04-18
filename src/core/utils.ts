import { exec } from 'child_process';
import clipboard from "clipboardy";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import fetch from 'node-fetch';
import open from "open";
import { ChatCompletionRequestMessage } from "openai";
import { homedir, platform } from "os";
import { join } from "path";
import { Logger } from "./logger";

const HISTORY_FILENAME = "history.json";
const API_KEY_FILENAME = "openai-api-key";
const API_KEY_PROCESS_KEY = "OPENAI_API_KEY";

export class Utils {

  static argIsTrue(arg: any): boolean {
    if (typeof arg === "string") {
      return arg.toLowerCase() === "true";
    }
    else if (typeof arg === "number") {
      return arg === 1;
    }
    else if (typeof arg === "boolean") {
      return arg;
    }
    return false;
  }

  /**
   * Replaces any clipboard tokens with whatever's currently in the clipboard
   * @param prompt 
   * @returns 
   */
  static insertClipboardText(prompt: string): string {

    // console.log("prompt:", prompt);

    const promptHasToken = ["<clipboard>", "[clipboard]", "{clipboard}"].some(ct => prompt.includes(ct));
    if (!promptHasToken) {
      // console.log("no tokens, returning");
      return prompt;
    }

    try {
      const clipboardValue = clipboard.readSync() ?? "";
      const regex = /(\<clipboard\>)|(\[clipboard\])|(\{clipboard\})/g;
      prompt = prompt.replace(regex, clipboardValue);
    } catch (error) {
      Logger.aside("could not read value from clipboard");
    }

    // console.log("prompt after clipboard tokens:", prompt);
    return prompt;
  }

  static async wait(ms = 1000) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    })
  }

  /** Get the Cass config dir path, and ensure the dir exists */
  static getCassDir() {
    const cassDir = join(homedir(), ".cass");
    if (!existsSync(cassDir)) {
      mkdirSync(cassDir);
    }
    return cassDir;
  }

  /** Get the Cass images dir path, and ensure the dir exists */
  static getCassImagesDir() {
    const imagesDir = join(this.getCassDir(), "images");
    if (!existsSync(imagesDir)) {
      mkdirSync(imagesDir);
    }
    return imagesDir;
  }

  static openCassDir(): void {
    const cmd = platform() === 'win32' ? 'explorer' : 'open';
    exec(`${cmd} ${this.getCassDir()}`);
  }

  static readHistory(): ChatCompletionRequestMessage[] {
    const cassDir = this.getCassDir();
    const historyFilePath = join(cassDir, HISTORY_FILENAME);

    if (existsSync(historyFilePath)) {
      const historyFileStr = readFileSync(historyFilePath, { encoding: "utf-8" });
      const messages = JSON.parse(historyFileStr).messages as ChatCompletionRequestMessage[];
      return messages;
    } else {
      return [];
    }
  }

  static addToHistory(messages: ChatCompletionRequestMessage[]) {
    const dir = this.getCassDir();
    const historyFilePath = join(dir, HISTORY_FILENAME);

    let existing: ChatCompletionRequestMessage[] = [];
    if (existsSync(historyFilePath)) {
      existing = this.readHistory();
    }

    writeFileSync(historyFilePath, JSON.stringify({
      messages: [...existing, ...messages],
    }, null, 2));
  }

  static getLatestHistory(history: ChatCompletionRequestMessage[], characters: number) {

    const latest: ChatCompletionRequestMessage[] = [];

    for (let i = history.length - 1; i >= 0; i--) {
      const msgLength = history[i].content.length;
      if (characters >= msgLength) {
        latest.push(history.slice(i, i + 1)[0])
        characters -= msgLength;
      } else {
        break;
      }
    }

    latest.reverse();
    return latest;
  }

  static clearHistory() {
    const cassDir = this.getCassDir();
    const historyFilePath = join(cassDir, HISTORY_FILENAME);

    if (existsSync(historyFilePath)) {
      const newFileName = HISTORY_FILENAME.replace(
        ".json",
        `-archived-${new Date().toISOString()}`.replace(/:/g, "-") + ".json",
      );
      const newFilePath = join(cassDir, newFileName);
      renameSync(historyFilePath, newFilePath);
    } else {
      return [];
    }
  }

  static storeApiKey(apiKey: string) {
    const cassDir = this.getCassDir();
    const apiKeyFilePath = join(cassDir, API_KEY_FILENAME);
    writeFileSync(apiKeyFilePath, apiKey + "\n", { encoding: "utf-8" });
  }

  static retrieveApiKey(): string | undefined {
    const cassDir = this.getCassDir();
    const apiKeyFilePath = join(cassDir, API_KEY_FILENAME);
    if (existsSync(apiKeyFilePath)) {
      const apiKeyFileString = readFileSync(apiKeyFilePath, { encoding: "utf-8" });
      return apiKeyFileString.trim();
    }
    return undefined;
  }

  static apiKey(): string | undefined {

    const fromEnv = process.env[API_KEY_PROCESS_KEY];
    if (fromEnv) return fromEnv;
    
    const fromFile = this.retrieveApiKey();
    if (fromFile) return fromFile;

    return undefined;
  }

  static async update(): Promise<boolean> {

    const confimationRes = await inquirer.prompt({
      type: "confirm",
      name: "confirmed",
      message: `Run "npm i -g @neonfish/cass@latest" to install latest version?`,
      default: true,
    });
    if (!confimationRes.confirmed) {
      return false;
    }

    return new Promise<boolean>((resolve, reject) => {
      
      exec("npm i -g @neonfish/cass@latest", (error, stdout, stderr) => {
        if (error !== null) {
          Logger.error(`Error updating global package:`, error);
          return false;
        }
        console.log(stdout);
        return true;
      });

    });
    
  }

  static async findLocationFromIp() {

    const url = "http://ip-api.com/json/";
    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
      },
    }).catch(err => {
      Logger.error("Error finding location from IP:", err);
      return undefined
    });
    if (!response) return undefined;

    const exampleResult = {
      "status":"success",
      "country":"United Kingdom",
      "countryCode":"GB",
      "region":"ENG",
      "regionName":"England",
      "city":"London",
      "zip":"SE10",
      "lat":51.4805,
      "lon":-0.0113,
      "timezone":"Europe/London",
      "isp":"31173 Services AB",
      "org":"31173 Services AB",
      "as":"AS39351 31173 Services AB",
      "query":"141.98.252.162",
    };
    const result = (await response.json()) as {
      status: string;
      country: string;
      countryCode: string;
      region: string;
      regionName: string;
      city: string;
      zip: string;
      lat: number;
      lon: number;
      timezone: string;
      isp: string;
      org: string;
      as: string;
      query: string;
    };

    const locationString = [
      result.city,
      result.regionName,
      result.country,
    ].filter(v => v).join(", ");
    if (!locationString) return undefined;

    return locationString;
  }

  /**
   * Open a given URL in the default browser
   * @param url 
   */
  static async openUrl(url: string) {
    await open(url);
  }

}
