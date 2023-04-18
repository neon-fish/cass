import chalk from "chalk";

export class Logger {
  
  static user(...messages: any[]) {
    console.log(chalk.cyanBright(...messages));
  }

  static cass(...messages: any[]) {
    console.log(chalk.greenBright(...messages));
  }

  static system(...messages: any[]) {
    console.log(chalk.blueBright(...messages));
  }

  static error(...messages: any[]) {
    // for (const msg of messages) {
    console.log(chalk.redBright(...messages));
    // }
  }

  static verbose(line: string) {
    console.log(chalk.magentaBright(line));
  }

  static verboseLines(...lines: string[]) {
    for (const line of lines) {
      console.log(chalk.magentaBright(line));
    }
  }

  /** Adds parentheses and prints in gray */
  static aside(message: string) {
    console.log(chalk.gray(`(${message})`));
  }

}
