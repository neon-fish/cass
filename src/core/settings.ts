import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Utils } from "./utils";

const SETTINGS_FILENAME = "settings.json";

// See: https://platform.openai.com/docs/models/overview
const MODELS = [
  "gpt-3.5-turbo",
  "gpt-4",
] as const;
export type Model = typeof MODELS[number];

interface SettingsValues {
  model: Model,
  temperature: number,
  /** The total token limit */
  totalTokens: number,
  /** The maximum number to allocate to the response */
  responseTokensMax: number,
  /** The maximum number to allocate to the history */
  historyTokensMax: number,
  userName: string | undefined,
  userLocation: string | undefined,
}

const DEFAULT_SETTINGS: SettingsValues = {
  model: "gpt-3.5-turbo",
  temperature: 0.5,
  totalTokens: 4096,
  responseTokensMax: 1500,
  historyTokensMax: 2000,
  userName: undefined,
  userLocation: undefined,
};

export class Settings {

  static settings: SettingsValues = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as SettingsValues;

  static load() {
    const cassDir = Utils.getCassDir();
    const settingsFilePath = join(cassDir, SETTINGS_FILENAME);

    if (existsSync(settingsFilePath)) {
      const settingsFileStr = readFileSync(settingsFilePath, { encoding: "utf-8" });
      const loadedSettings = JSON.parse(settingsFileStr) as Partial<SettingsValues>;
      
      if (loadedSettings.model !== undefined) this.settings.model = loadedSettings.model;
      if (loadedSettings.totalTokens !== undefined) this.settings.totalTokens = loadedSettings.totalTokens;
      if (loadedSettings.responseTokensMax !== undefined) this.settings.responseTokensMax = loadedSettings.responseTokensMax;
      if (loadedSettings.historyTokensMax !== undefined) this.settings.historyTokensMax = loadedSettings.historyTokensMax;
      if (loadedSettings.userName !== undefined) this.settings.userName = loadedSettings.userName;
      if (loadedSettings.userLocation !== undefined) this.settings.userLocation = loadedSettings.userLocation;

    } else {
      this.save();
    }
  }

  static save() {
    const cassDir = Utils.getCassDir();
    const settingsFilePath = join(cassDir, SETTINGS_FILENAME);

    writeFileSync(settingsFilePath, JSON.stringify(this.settings, null, 2), { encoding: "utf-8" });
  }

}
Settings.load();
