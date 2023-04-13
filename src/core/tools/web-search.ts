import { inspect } from "util";
import fetch from 'node-fetch';
import { JSDOM } from "jsdom";
import chalk from "chalk";
import ora from "ora";
import { Utils } from "../utils";

export interface SearchResult {
  title: string | undefined,
  link: string | undefined,
  snippet: string | undefined,
}

export async function runWebSearch(query: string, opts?: {
  resultsCount?: number,
  verbose?: boolean,
}): Promise<SearchResult[] | { error: string }> {

  const verbose = opts?.verbose === true;
  const resultsCount = opts?.resultsCount ?? 10;

  const queryParam = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html?q=${queryParam}`;

  if (verbose) {
    Utils.logVerboseLines(
      `Web Search: query: ${query}`,
      `Web Search: param: ${queryParam}`,
      `Web Search: URL: ${url}`,
      ""
    );
  }

  console.log(chalk.blueBright(`> Web search: ${query}`));
  console.log("");

  const spinner = ora({
    text: chalk.greenBright(`searching...`),
    color: "green",
  }).start();

  const response = await fetch(url, {
    headers: {
      "accept": "text/html",
    },
  });
  const page = await response.text();

  spinner.stop();

  // Sometimes it fails
  if (page.includes("error-lite@duckduckgo.com")) {

    console.log(chalk.redBright(`> Web search failed`));
    console.log("");

    return {
      error: "The web search failed",
    };

  }

  // console.log("Page:");
  // console.log(page);

  const dom = new JSDOM(page);

  const resultEls = Array.from(dom.window.document.getElementsByClassName("result__body"));
  // console.log("Result elements:");
  // console.log(resultEls);

  let results: SearchResult[] = [];

  for (const resultEl of resultEls) {
    const title = (resultEl.getElementsByClassName("result__a")[0] as HTMLAnchorElement | undefined)?.text;
    const rawLink = (resultEl.getElementsByClassName("result__url")[0] as HTMLAnchorElement | undefined)?.href;
    const snippet = (resultEl.getElementsByClassName("result__snippet")[0] as HTMLAnchorElement | undefined)?.text;

    let link: string | undefined = (rawLink ?? "")
    link = link.replace("//duckduckgo.com/l/?uddg=", "");
    link = link.split("&rut=")[0] ?? "";
    link = link ? link : undefined,

    results.push({
      title,
      link,
      snippet,
    });
  }
  const totalResults = results.length;

  if (results.length > resultsCount) {
    results = results.slice(0, resultsCount);
  }

  if (verbose) {
    Utils.logVerboseLines(
      "Web Search: result titles:",
      inspect(results.map(r => r.title)),
      ""
    );
  }

  console.log(chalk.blueBright(`> Found: "${results[0].title}", and ${results.length - 1} more`));
  console.log("");

  return results;

}
