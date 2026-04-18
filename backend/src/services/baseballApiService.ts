import { config } from "../config";
import { createJsonHttpClient } from "../lib/httpClient";
import type { RequestQuery } from "../types/externalApi";

const baseballClient = createJsonHttpClient({
  baseUrl: config.externalApis.baseball.baseUrl,
  defaultHeaders: config.externalApis.baseball.headers,
});

export const baseballApiService = {
  get<TResponse>(path: string, query?: RequestQuery): Promise<TResponse> {
    return baseballClient.get<TResponse>(path, { query });
  },
};
