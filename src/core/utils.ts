import chalk from "chalk";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { ChatCompletionRequestMessage } from "openai";
import { homedir } from "os";
import { join } from "path";

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

  static getCassDir() {
    const cassDir = join(homedir(), ".cass");
    if (!existsSync(cassDir)) {
      mkdirSync(cassDir);
    }
    return cassDir;
  }

  static readHistory(): ChatCompletionRequestMessage[] {
    const dir = this.getCassDir();
    const historyFilePath = join(dir, "history.json");

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
    const historyFilePath = join(dir, "history.json");

    let existing: ChatCompletionRequestMessage[] = [];
    if (existsSync(historyFilePath)) {
      existing = this.readHistory();
    }

    writeFileSync(historyFilePath, JSON.stringify({
      messages: [...existing, ...messages],
    }));
  }

  static getLatestHistory(history: ChatCompletionRequestMessage[], characters: number) {

    const latest: ChatCompletionRequestMessage[] = [];

    for (let i = history.length -1; i >= 0; i--) {
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

}
