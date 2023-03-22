
# Cass

A ChatGPT-powered assistant in the console (**C**onsole **Ass**istant)

![npm (scoped)](https://img.shields.io/npm/v/@neonfish/cass)

## Quickstart

```sh
$ npm i -g @neonfish/cass
```

Set your OpenAI API key: (Alternatively, add the environment variable `OPENAI_API_KEY`)

```sh
$ cass --api-key=<your-openai-api-key>
```

Then simply enter the prompt in the console:

```sh
$ cass give me the first 10 fibonacci numbers
```

and the response is generated after a few seconds:

```sh
$ cass give me the first 10 fibonacci numbers

> give me the first 10 fibonacci numbers

> No problem! The first 10 Fibonacci numbers are 0, 1, 1, 2, 3, 5, 8, 13, 21, and 34. Is there anything else I can 
help you with?
```

## Options

Run `cass --help` for more instructions and options.

Prompts may or may not be wrapped in quotation marks. If the prompt contains special characters, quotation marks must be used to avoid the terminal interpreting them as instructions.

### Clipboard

Text can be inserted from the clipboard. This is useful for including long multiline text, code, etc.

Use one of the following placeholders (they are equivalent): `<clipboard>`, `[clipboard]`, or `{clipboard}`

An example is shown below, including the original prompt, the expanded confirmation of the input prompt including the clipboard contents, and the response:

```
    $ cass "what's wrong with this function: <clipboard>"

    > What's wrong with this typescript function: /** Convert a time of day in milliseconds to a 24-hour string */
    export function millisTo24Hour(millis: number): string {
        let secs = millis / 1000;
        let mins = secs / 60;
        let hrs = mins / 60;
        return `${hrs}:${mins}`;
    }

    > The `millisTo24Hour` function in TypeScript has a mistake in the calculation of the hours and minutes. Here's the corrected code:

    ```typescript
    /** Convert a time of day in milliseconds to a 24-hour string */
    export function millisTo24Hour(millis: number): string {
        let secs = millis / 1000;
        let mins = Math.floor(secs / 60);
        let hrs = Math.floor(mins / 60);
        mins = mins % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
```

The issue with the original code is that it calculates the hours and minutes as ratios of seconds and minutes, respectively, instead of taking the remainder after dividing by 60. This leads to incorrect values for hours and minutes.

The corrected code uses the `Math.floor()` function to extract the whole number of hours and minutes, and the modulus operator `%` to get the remainder. It also uses the `padStart()` method to ensure that the hours and minutes are always two digits, with a leading zero if necessary.       

With these changes, the `millisTo24Hour` function should now correctly convert a time of day in milliseconds to a 24-hour string.
```

### Flags:

- `--update`: install the latest version of the NPM package
- `--verbose` or `-v`: enable verbose output
- `--dry` or `--dry-run`: disable sending an actrual API request
- `--cls` or `--clear`: archive the recent message history
- `--cass-dir`: open the config directory in file explorer

## Development

1. Clone the repo
2. Link with `npm link`
3. Watch source files and rebuild with `npm run dev`
4. Run the updated CLI with `cass <prompt>`

Or without linking:

1. Clone the repo
2. Watch source files and rebuild with `npm run dev`
3. Run the updated CLI with `npm start -- <prompt>` (note the spaces)
    - Example: `npm start -- tell me a joke -v`

## TODO

- streaming responses
- cancelling requests
