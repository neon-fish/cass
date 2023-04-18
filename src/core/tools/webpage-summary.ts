import { inspect } from "util";
import fetch from 'node-fetch';
import { JSDOM } from "jsdom";
import chalk from "chalk";
import ora from "ora";
import { Readability } from "@mozilla/readability";
import createDOMPurify from "dompurify";
import { Logger } from "../logger";

export interface PageSummary {
  title: string;
  // content: string;
  textContent: string;
  // length: number;
  excerpt: string;
  byline: string;
  // dir: string;
  siteName: string;
  lang: string;
}

export async function webpageSummary(url: string, opts?: {
  // resultsCount?: number,
  verbose?: boolean,
}): Promise<PageSummary | { error: string }> {

  const verbose = opts?.verbose === true;
  // const resultsCount = opts?.resultsCount ?? 10;

  // const queryParam = encodeURIComponent(query);
  // const url = `https://html.duckduckgo.com/html?q=${queryParam}`;

  url = decodeURIComponent(url);

  if (verbose) {
    Logger.verboseLines(
      // `Web Search: query: ${query}`,
      // `Web Search: param: ${queryParam}`,
      `Open Web URL: ${url}`,
      ""
    );
  }

  Logger.system(`> Web page: ${url}`);
  Logger.system("");

  const spinner = ora({
    text: chalk.greenBright(`opening web page...`),
    color: "green",
  }).start();

  const response = await fetch(url, {
    headers: {
      "accept": "text/html",
    },
  }).catch(err => {
    Logger.error(err);
    return {
      error: "",
    };
  });
  spinner.stop();

  if ("error" in response) {
    Logger.error(`> Opening web page failed`);
    Logger.error("");
    return { error: response.error };
  }

  const rawPageString = await response.text();

  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  const cleanPageString = DOMPurify.sanitize(rawPageString);

  // console.log(pageString);
  // return pageString;

  const dom = new JSDOM(cleanPageString, {
    url: url,
    // runScripts <- leave as default
  });
  const readability = new Readability(dom.window.document);
  const article = readability.parse();

  if (!article) {
    Logger.error(`> Parsing web page failed`);
    Logger.error("");
    return { error: "Could not parse returned page" };
  }
  
  // The HTML string is too big and not required
  article.content = "";

  // The text content has loads of space and new lines.
  // This removes the indentations and duplicate "empty" lines.

  const textLines = article.textContent.split("\n");
  const tidiedTextLines: string[] = [];
  let lastLineWasEmpty: boolean = false;

  for (const line of textLines) {
    const trimmed = line.trim();
    if (trimmed) {
      tidiedTextLines.push(trimmed);
      lastLineWasEmpty = false;
    } else {
      if (lastLineWasEmpty) {
        // Ignore another empty line
      } else {
        tidiedTextLines.push(trimmed);
        lastLineWasEmpty = true;
      }
    }
  }

  article.textContent = tidiedTextLines.join("\n");
  
  if (verbose) {
    // console.log("Page as parsed article:", article);
    Logger.verboseLines(
      `Parsed web page at: ${url}`,
      inspect(article),
      ""
    );
  }

  Logger.system(`> Parsed web page: "${article.title || article.siteName || "(no title)"}" (${url})`);
  Logger.system("");

  const summary: PageSummary = {
    siteName: article.siteName,
    lang: article.lang,
    title: article.title,
    byline: article.byline,
    excerpt: article.excerpt,
    textContent: article.textContent,
  };

  return summary;

}
