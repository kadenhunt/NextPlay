import { config } from "../config";
import { createJsonHttpClient } from "../lib/httpClient";
import type { CollegeSport, RequestQuery } from "../types/externalApi";

const footballClient = createJsonHttpClient({
  baseUrl: config.externalApis.football.baseUrl,
  defaultHeaders: config.externalApis.football.headers,
});

const basketballClient = createJsonHttpClient({
  baseUrl: config.externalApis.basketball.baseUrl,
  defaultHeaders: config.externalApis.basketball.headers,
});

const clientsBySport = {
  football: footballClient,
  basketball: basketballClient,
};

const getClient = (sport: CollegeSport) => clientsBySport[sport];

export const footballBasketballApiService = {
  getBySport<TResponse>(
    sport: CollegeSport,
    path: string,
    query?: RequestQuery,
  ): Promise<TResponse> {
    return getClient(sport).get<TResponse>(path, { query });
  },

  getFootball<TResponse>(path: string, query?: RequestQuery): Promise<TResponse> {
    return footballClient.get<TResponse>(path, { query });
  },

  getBasketball<TResponse>(path: string, query?: RequestQuery): Promise<TResponse> {
    return basketballClient.get<TResponse>(path, { query });
  },
};
