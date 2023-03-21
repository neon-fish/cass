
# Cass

A ChatGPT-powered virtual assistant in the console (**C**onsole **Ass**istant)

## Quickstart

```
$ npm i -g @neonfish/cass
```

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