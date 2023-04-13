import { inspect } from "util";
import fetch from 'node-fetch';
import { JSDOM } from "jsdom";

export interface SearchResult {
  title: string | undefined,
  link: string | undefined,
  snippet: string | undefined,
}

export async function runWebSearch(query: string, opts?: {
  resultsCount?: number,
  verbose?: boolean,
}): Promise<SearchResult[]> {

  const verbose = opts?.verbose === true;
  const resultsCount = opts?.resultsCount ?? 10;

  // const queryString = "jack russell";
  verbose && console.log(`Web Search: query: ${query}`);

  const queryParam = encodeURIComponent(query);
  verbose && console.log(`Web Search: param: ${queryParam}`);

  const url = `https://html.duckduckgo.com/html?q=${queryParam}`;
  verbose && console.log(`Web Search: URL: ${url}`);

  const response = await fetch(url, {
    headers: {
      "accept": "text/html",
    },
  });
  const page = await response.text();

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

  if (results.length > resultsCount) {
    results = results.slice(0, resultsCount);
  }

  if (verbose) {
    console.log("Web Search: result titles:", inspect(results.map(r => r.title)));
  }

  return results;

}
