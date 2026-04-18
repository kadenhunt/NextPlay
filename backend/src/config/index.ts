import { env } from "./env";

export const config = {
  env: env.nodeEnv,
  port: env.port,
  externalApis: {
    footballBasketball: {
      apiKey: env.footballBasketballApiKey,
    },
    baseball: {
      apiKey: env.baseballApiKey,
      host: env.baseballApiHost,
    },
  },
};
