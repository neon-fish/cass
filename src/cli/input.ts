import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Utils } from "../core/utils";

const argsParser = yargs(hideBin(process.argv))
  .usage(`USAGE:\nSimply type a question or instruction. Wrap the input in quotes if the prompt contains special characters. Example:\n$ cass tell me a joke about programming\n\nTo insert text from the clipboard, use one of the placeholders. Example:\n$ cass "what's wrong with this function: <clipboard>"`)
  .help('h').alias('h', 'help')
  .option("ui", {
    boolean: true,
    // alias: ["s", "ui"],
    describe: "Start the web server and open the web-based UI",
  })
  .option("serve", {
    boolean: true,
    alias: ["s"],
    describe: "Start the web server without opening the UI",
  })
  .option("image", {
    boolean: true,
    alias: ["img", "i"],
    describe: "Use the prompt to generate an image instead of a chat message",
  })
  .option("count", {
    alias: ["n"],
    describe: "Specify how many images to generate",
  })
  .option("verbose", {
    boolean: true,
    alias: "v",
    describe: "Show verbose information for debugging",
  })
  .option("dir", {
    boolean: true,
    alias: "cass-dir",
    describe: "Open the Cass config directory in file explorer",
  })
  .option("dry", {
    boolean: true,
    alias: "dry-run",
    describe: "Do not send a request to the API",
  })
  .option("clear", {
    boolean: true,
    alias: ["cls", "c"],
    describe: "Archive the recent history",
  })
  .option("api-key", {
    alias: "key",
    describe: "Use and store the given OpenAI API key",
  })
  .option("tokens", {
    alias: "t",
    describe: "Specify the maximum number of tokens to use in the response",
  })
  .option("up", {
    boolean: true,
    alias: ["update", "upgrade"],
    describe: "Update the globally-installed NPM package",
  })
  .option("gpt3", {
    boolean: true,
    alias: "3",
    describe: "Force the use of GPT 3.5 Turbo for this prompt",
  })
  .option("gpt4", {
    boolean: true,
    alias: "4",
    describe: "Force the use of GPT 4 for this prompt",
  })
  .option("user-name", {
    alias: "name",
    describe: "Update the name of the user",
  })
  .option("user-location", {
    alias: "location",
    describe: `Update the approximate location of the user ("auto" to find by IP)`,
  })
  .epilog('(https://github.com/neon-fish/cass)')
  ;

export interface CliConfig {
  ui: boolean,
  serve: boolean,
  verbose: boolean,
  cassDir: boolean,
  dryRun: boolean,
  clear: boolean,
  apiKey: string | undefined,
  tokens: number | undefined,
  update: boolean,
  gpt3: boolean,
  gpt4: boolean,
  image: boolean,
  imageCount: number | undefined,
  userName: string | undefined,
  userLocation: string | undefined,
}

export async function parseCliInput() {

  const argv = await argsParser.argv;

  let prompt = argv._.map(p => p.toString().trim()).join(" ");

  const cliConfig: CliConfig = {
    ui: Boolean(argv.ui),
    serve: Boolean(argv.serve),
    verbose: Boolean(argv.verbose),
    cassDir: Boolean(argv.cassDir),
    dryRun: Boolean(argv.dryRun),
    clear: Boolean(argv.clear),
    apiKey: argv.apiKey?.toString() ? argv.apiKey.toString() : undefined,
    tokens: argv.tokens?.toString() ? Number(argv.tokens.toString()) : undefined,
    update: Boolean(argv.update),
    gpt3: Boolean(argv.gpt3),
    gpt4: Boolean(argv.gpt4),
    image: Boolean(argv.image),
    imageCount: argv.count?.toString() ? Number(argv.count.toString()) : undefined,
    userName: argv.userName?.toString() ? argv.userName.toString() : undefined,
    userLocation: argv.userLocation?.toString() ? argv.userLocation.toString() : undefined,
  };

  prompt = Utils.insertClipboardText(prompt);

  return {
    prompt,
    cliConfig,
    argv,
  };

}
