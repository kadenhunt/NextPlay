import { config as loadDotenv } from "dotenv";
import path from "node:path";

loadDotenv();
loadDotenv({ path: path.resolve(__dirname, "../../.env"), override: false });
loadDotenv({ path: path.resolve(__dirname, "../../../.env"), override: false });

type NodeEnv = "development" | "test" | "production";

export type EnvConfig = {
  port: number;
  nodeEnv: NodeEnv;
  footballBasketballApiKey: string;
  baseballApiKey: string;
  baseballApiHost: string;
  /** When set with `jwtSecret`, enables Postgres-backed auth routes. */
  databaseUrl?: string;
  jwtSecret?: string;
  authEnabled: boolean;
};

const allowedNodeEnvs: NodeEnv[] = ["development", "test", "production"];

const readRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const readPort = (): number => {
  const rawPort = process.env.PORT?.trim();

  if (!rawPort) {
    return 4000;
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Environment variable PORT must be a positive integer");
  }

  return port;
};

const readNodeEnv = (): NodeEnv => {
  const rawNodeEnv = process.env.NODE_ENV?.trim() ?? "development";

  if (!allowedNodeEnvs.includes(rawNodeEnv as NodeEnv)) {
    throw new Error(
      `Environment variable NODE_ENV must be one of: ${allowedNodeEnvs.join(", ")}`,
    );
  }

  return rawNodeEnv as NodeEnv;
};

const readOptionalEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
};

const readAuthConfig = (): Pick<EnvConfig, "databaseUrl" | "jwtSecret" | "authEnabled"> => {
  const databaseUrl = readOptionalEnv("DATABASE_URL");
  const jwtSecret = readOptionalEnv("JWT_SECRET");

  if ((databaseUrl && !jwtSecret) || (!databaseUrl && jwtSecret)) {
    throw new Error(
      "DATABASE_URL and JWT_SECRET must either both be set or both be omitted",
    );
  }

  return {
    databaseUrl,
    jwtSecret,
    authEnabled: Boolean(databaseUrl && jwtSecret),
  };
};

const authConfig = readAuthConfig();

export const env: EnvConfig = {
  port: readPort(),
  nodeEnv: readNodeEnv(),
  footballBasketballApiKey: readRequiredEnv("FOOTBALL_BASKETBALL_API_KEY"),
  baseballApiKey: readRequiredEnv("BASEBALL_API_KEY"),
  baseballApiHost: readRequiredEnv("BASEBALL_API_HOST"),
  ...authConfig,
};
