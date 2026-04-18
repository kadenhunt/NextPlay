export type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type RequestQuery = Record<string, QueryParamValue>;

export type CollegeSport = "football" | "basketball";

export type ExternalApiRequestOptions = {
  query?: RequestQuery;
  headers?: HeadersInit;
  timeoutMs?: number;
};

export type ExternalCollegeAthlete = Record<string, unknown> & {
  id?: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  team?: string;
  school?: string;
  position?: string;
};

export type ExternalBaseballAthlete = Record<string, unknown> & {
  id?: number | string;
  name?: string;
  team?: string;
  position?: string;
  school?: string;
};
