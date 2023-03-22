import chalk from "chalk";
import { exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { ChatCompletionRequestMessage } from "openai";
import { homedir, platform } from "os";
import { join } from "path";

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

  static async wait(ms = 1000) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    })
  }

  static logVerboseLines(...lines: string[]) {
    for (const line of lines) {
      console.log(chalk.magentaBright(line));
    }
  }

  /** Get the Cass config dir path, and ensure the dir exists */
  static getCassDir() {
    const cassDir = join(homedir(), ".cass");
    if (!existsSync(cassDir)) {
      mkdirSync(cassDir);
    }
    return cassDir;
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

}
