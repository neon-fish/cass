
# Cass

A ChatGPT-powered assistant in the console (**C**onsole **Ass**istant)

## Quickstart

```
$ npm i -g @neonfish/cass
```

Set your OpenAI API key

> TODO, use.env in the project root for now

Simply enter the prompt in the console:

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

- Prompts may or may not be wrapped in quotation marks. If the prompt contains special characters, quotation marks must be used to be interpreted by the terminal correctly.
- Set the `--verbose` or `-v` flags to true, "true", or 1 to enable verbose output

## Development

1. Clone the repo
2. Link with `npm link`
3. Watch source files and rebuild with `npm run dev`
4. Run the updated CLI with `cass <prompt>`
