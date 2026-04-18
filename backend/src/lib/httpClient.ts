import { URL } from "node:url";

import type {
  ExternalApiRequestOptions,
  QueryParamValue,
  RequestQuery,
} from "../types/externalApi";

type JsonHttpClientConfig = {
  baseUrl: string;
  defaultHeaders?: HeadersInit;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15000;

const appendQueryParams = (url: URL, query?: RequestQuery): void => {
  if (!query) {
    return;
  }

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    url.searchParams.set(key, stringifyQueryValue(rawValue));
  }
};

const stringifyQueryValue = (value: Exclude<QueryParamValue, null | undefined>): string => {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text || null;
};

export class HttpClientError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body: unknown;

  constructor(message: string, details: { status: number; url: string; body: unknown }) {
    super(message);
    this.name = "HttpClientError";
    this.status = details.status;
    this.url = details.url;
    this.body = details.body;
  }
}

export const createJsonHttpClient = ({
  baseUrl,
  defaultHeaders,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: JsonHttpClientConfig) => {
  const get = async <TResponse>(
    path: string,
    options: ExternalApiRequestOptions = {},
  ): Promise<TResponse> => {
    const url = new URL(path, baseUrl);
    appendQueryParams(url, options.query);

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? timeoutMs,
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      const body = await parseResponseBody(response);

      if (!response.ok) {
        throw new HttpClientError(
          `Request failed with status ${response.status}`,
          {
            status: response.status,
            url: url.toString(),
            body,
          },
        );
      }

      return body as TResponse;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    get,
  };
};
