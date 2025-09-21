import { z } from "zod";
import { logger } from "./logger.js";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";

dotenv.config({ path: join(process.cwd(), "src/config/.env") });
const MODULE = "ConfigState";

const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), "src/config/gcp-service-account.json"), "utf-8")
);

const EnvConfigSchema = z.object({
  NODE_ENV: z.string(),
  CRYPTO_SECRET: z.string(),
  SECRET: z.string(),
  PORT: z.string(),
  PUBLIC_GOOGLE_CLIENT_ID: z.string(),
  VERTEX_API_KEY: z.string(),
  AMADEUS_CLIENT_ID: z.string(),
  AMADEUS_CLIENT_SECRET: z.string(),
});

type EnvConfig = z.infer<typeof EnvConfigSchema>;

const AdditionalConfigSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
});

type AdditionalConfig = z.infer<typeof AdditionalConfigSchema>;

// custom config values
const additionalConf: AdditionalConfig = {
  GOOGLE_CLIENT_ID: serviceAccount.client_id,
};

const envConf: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  CRYPTO_SECRET: process.env.CRYPTO_SECRET || "default_crypto_secret",
  SECRET: process.env.SECRET || "default_secret",
  PORT: process.env.PORT || "4000",
  PUBLIC_GOOGLE_CLIENT_ID: process.env.PUBLIC_GOOGLE_CLIENT_ID || "default_public_google_client_id",
  VERTEX_API_KEY: process.env.VERTEX_API_KEY || "default_vertex_api_key",
  AMADEUS_CLIENT_ID: process.env.AMADEUS_CLIENT_ID || "default_amadeus_client_id",
  AMADEUS_CLIENT_SECRET: process.env.AMADEUS_CLIENT_SECRET || "default_amadeus_client_secret",
};

export const ConfigSchema = AdditionalConfigSchema.merge(EnvConfigSchema);
export type Config = z.infer<typeof ConfigSchema>;

class ConfigState {
  private config: Config | undefined;
  private static instance: ConfigState | undefined;
  constructor() {
    if (ConfigState.instance) {
      return ConfigState.instance; // Enforce singleton behavior
    }
    logger.info({
      message: "Initializing configuration...",
      module: MODULE,
      skipDb: true,
    });
    this.parse();
    ConfigState.instance = this;
  }

  getAll() {
    return this.config;
  }

  get<T = string>(key: keyof Config): T {
    if (!this.config) throw new Error("unable to initiate config!");
    return this.config[key] as T;
  }

  parse() {
    this.config = ConfigSchema.parse({ ...additionalConf, ...envConf });
  }
}

export const config = new ConfigState();
