import chalk from "chalk";

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

}
