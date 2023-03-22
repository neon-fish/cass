
# Cass

A ChatGPT-powered assistant in the console (**C**onsole **Ass**istant)

## Quickstart

```
$ npm i -g @neonfish/cass
```

Set your OpenAI API key: (Alternatively, add the environment variable `OPENAI_API_KEY`)

```
$ cass --api-key=<your-openai-api-key>
```

Then simply enter the prompt in the console:

```
$ cass give me the first 10 fibonacci numbers
```

and the response is generated after a few seconds:

```
$ cass give me the first 10 fibonacci numbers

> give me the first 10 fibonacci numbers

> No problem! The first 10 Fibonacci numbers are 0, 1, 1, 2, 3, 5, 8, 13, 21, and 34. Is there anything else I can 
help you with?
```

## Options

Run `cass --help` for more instructions and options.

- Prompts may or may not be wrapped in quotation marks. If the prompt contains special characters, quotation marks must be used to be interpreted by the terminal correctly.
- Pass the `--verbose` or `-v` flag to enable verbose output
- Pass the `--dry` or `--dry-run` flag to disable sending an actrual API request
- Pass the `--cls` or `--clear` flag to archive the recent message history
- Pass the `--cass-dir` flag to open the config directory in file explorer

## Development

1. Clone the repo
2. Link with `npm link`
3. Watch source files and rebuild with `npm run dev`
4. Run the updated CLI with `cass <prompt>`
