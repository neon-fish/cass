import { Configuration, CreateImageRequestResponseFormatEnum, ImagesResponse, OpenAIApi } from "openai";
import { Utils } from "./utils";
import fetch from 'node-fetch';
import { writeFile } from "fs/promises";
import { join } from "path";
import { Logger } from "./logger";

export async function generateImage(prompt: string, opts?: {
  verbose?: boolean,
  n?: number,
}): Promise<ImagesResponse | string> {

  const verbose = Boolean(opts?.verbose);

  if (!prompt) {
    return "No prompt";
  }

  const apiKey = Utils.apiKey();
  if (!apiKey) {
    return `No API key!\nSee: https://platform.openai.com/docs/api-reference/authentication \nThen set the key using:\n$ cass --api-key=<your-new-api-key>`;
  }

  const configuration = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(configuration);

  const n = opts?.n ?? 1;
  const size: "256x256" | "512x512" | "1024x1024" = "1024x1024";
  const response_format: CreateImageRequestResponseFormatEnum = "url";

  if (verbose) {
    Logger.verboseLines(
      "",
      `API KEY: ${apiKey}`,
      `PROMPT: ${prompt}`,
      `IMAGES: ${n}`,
      `SIZE: ${size}`,
      `RESPONSE: ${response_format}`,
      "",
    );
  }
  
  const response = await openai.createImage({
    prompt: prompt,
    n: n,
    size: size,
    response_format,
  });

  for await (const [i, res] of response.data.data.entries()) {

    if (res.url) {
      const ext = getFileExtension(res.url) ?? "txt";
      const useIndex = n > 1;
      const filename = sanitizeFilename(prompt) + (useIndex ? `-${i}` : "") + "." + ext;
      const filePath = join(Utils.getCassImagesDir(), filename);
      downloadImage(res.url, filePath);
    }

    else if(res.b64_json) {
      res.b64_json
      Logger.error(`SAVING BASE64 IMAGES IS NOT IMPLEMENTED`);
    }

  }

  // return `Saved ${response.data.created} new images to Cass directory (\`cass --dir\`)`;
  return response.data;

}

async function downloadImage(url: string, filePath: string): Promise<void> {
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    await writeFile(filePath, buffer);
    // console.log('Image saved to', filePath);
  } catch (error) {
    Logger.error('Error downloading or saving image:', error);
  }
}

function sanitizeFilename(input: string): string {
  const illegalCharacters = /[\/:*?"<>|]/g;
  const controlCharacters = /[\x00-\x1f\x80-\x9f]/g;
  const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

  const sanitized = input
    .replace(illegalCharacters, '_')
    .replace(controlCharacters, '')
    .replace(reservedNames, '_$1')
    .slice(0, 250);

  return sanitized;
}

function getFileExtension(url: string): string | undefined {
  const parsedUrl = new URL(url);
  const pathname = parsedUrl.pathname;
  const lastDotIndex = pathname.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return undefined;
  }

  const extension = pathname.slice(lastDotIndex + 1);
  return extension;
}
