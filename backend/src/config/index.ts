import { env } from "./env";

const jsonHeaders = {
  Accept: "application/json",
};

export const config = {
  env: env.nodeEnv,
  port: env.port,
  externalApis: {
    football: {
      baseUrl: "https://api.collegefootballdata.com",
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${env.footballBasketballApiKey}`,
      },
    },
    basketball: {
      baseUrl: "https://api.collegebasketballdata.com",
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${env.footballBasketballApiKey}`,
      },
    },
    baseball: {
      baseUrl: `https://${env.baseballApiHost}`,
      headers: {
        ...jsonHeaders,
        "x-rapidapi-host": env.baseballApiHost,
        "x-rapidapi-key": env.baseballApiKey,
      },
    },
  },
};
