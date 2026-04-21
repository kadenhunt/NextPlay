import { HttpClientError } from "../lib/httpClient";
import { baseballApiService } from "./baseballApiService";
import { footballBasketballApiService } from "./footballBasketballApiService";
import type {
  MatchupSourceItem,
  ScoreSourceItem,
  SourceMetadata,
  SourceQuery,
  SourceResponse,
  SourceSport,
  StandingSourceItem,
} from "../types/sourceData";

export class SourceDataServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "SourceDataServiceError";
    this.statusCode = statusCode;
  }
}

const nowIso = (): string => new Date().toISOString();

const currentYear = (): number => new Date().getFullYear();

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const readObject = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
};

const readArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  const record = readObject(value);

  if (!record) {
    return [];
  }

  for (const key of ["data", "items", "results"]) {
    if (Array.isArray(record[key])) {
      return record[key] as T[];
    }
  }

  return [];
};

const buildMetadata = (
  sport: SourceSport,
  provider: string,
  fallbackUsed = false,
  message?: string,
): SourceMetadata => ({
  sport,
  provider,
  fetchedAt: nowIso(),
  fallbackUsed,
  ...(message ? { message } : {}),
});

const buildFallback = <TItem>(
  sport: SourceSport,
  provider: string,
  message: string,
): SourceResponse<TItem> => ({
  items: [],
  source: buildMetadata(sport, provider, true, message),
});

const normalizeFootballStatus = (record: Record<string, unknown>): string => {
  const completed = record.completed === true;
  const startDate = normalizeString(record.startDate);

  if (completed) {
    return "FINAL";
  }

  if (startDate) {
    const startMs = Date.parse(startDate);
    if (!Number.isNaN(startMs) && startMs <= Date.now()) {
      return "LIVE";
    }
  }

  return "SCHEDULED";
};

const normalizeBaseballStatus = (record: Record<string, unknown>): string => {
  const status = normalizeString(record.status) ?? normalizeString(record.state);

  if (!status) {
    return "UNKNOWN";
  }

  const upper = status.toUpperCase();

  if (upper.includes("FINISH")) {
    return "FINAL";
  }

  if (upper.includes("LIVE") || upper.includes("PROGRESS")) {
    return "LIVE";
  }

  if (upper.includes("POSTPON")) {
    return "POSTPONED";
  }

  return upper;
};

const mapFootballGameToScore = (record: Record<string, unknown>): ScoreSourceItem | null => {
  const id = normalizeString(record.id) ?? String(record.id ?? "");
  const homeTeam = normalizeString(record.homeTeam);
  const awayTeam = normalizeString(record.awayTeam);

  if (!id || !homeTeam || !awayTeam) {
    return null;
  }

  return {
    id,
    sport: "football",
    status: normalizeFootballStatus(record),
    startTime: normalizeString(record.startDate) ?? null,
    homeTeam,
    awayTeam,
    homeScore: normalizeNumber(record.homePoints),
    awayScore: normalizeNumber(record.awayPoints),
    week: normalizeNumber(record.week) ?? undefined,
    season: normalizeNumber(record.season) ?? undefined,
  };
};

const mapFootballGameToMatchup = (
  record: Record<string, unknown>,
): MatchupSourceItem | null => {
  const score = mapFootballGameToScore(record);

  if (!score) {
    return null;
  }

  const venueRecord = readObject(record.venue);

  return {
    ...score,
    venue:
      normalizeString(record.venue) ??
      normalizeString(venueRecord?.name) ??
      normalizeString(record.excitement) ??
      undefined,
  };
};

const mapFootballStanding = (record: Record<string, unknown>): StandingSourceItem | null => {
  const team = normalizeString(record.team);

  if (!team) {
    return null;
  }

  const totalRecord = readObject(record.total);

  return {
    id: team,
    sport: "football",
    team,
    rank: normalizeNumber(record.rank),
    wins:
      normalizeNumber(record.totalWins) ??
      normalizeNumber(totalRecord?.wins) ??
      normalizeNumber(record.wins),
    losses:
      normalizeNumber(record.totalLosses) ??
      normalizeNumber(totalRecord?.losses) ??
      normalizeNumber(record.losses),
    pointsFor:
      normalizeNumber(record.pointsFor) ??
      normalizeNumber(record.totalPointsFor) ??
      null,
    pointsAgainst:
      normalizeNumber(record.pointsAgainst) ??
      normalizeNumber(record.totalPointsAgainst) ??
      null,
    conference: normalizeString(record.conference) ?? null,
    season: normalizeNumber(record.year),
  };
};

const mapBaseballMatchToScore = (record: Record<string, unknown>): ScoreSourceItem | null => {
  const id = normalizeString(record.id) ?? String(record.id ?? "");
  const homeTeamRecord = readObject(record.homeTeam);
  const awayTeamRecord = readObject(record.awayTeam);
  const homeTeam =
    normalizeString(record.homeTeamName) ??
    normalizeString(homeTeamRecord?.displayName) ??
    normalizeString(homeTeamRecord?.name);
  const awayTeam =
    normalizeString(record.awayTeamName) ??
    normalizeString(awayTeamRecord?.displayName) ??
    normalizeString(awayTeamRecord?.name);

  if (!id || !homeTeam || !awayTeam) {
    return null;
  }

  return {
    id,
    sport: "baseball",
    status: normalizeBaseballStatus(record),
    startTime:
      normalizeString(record.startDate) ??
      normalizeString(record.date) ??
      normalizeString(record.scheduledAt) ??
      null,
    homeTeam,
    awayTeam,
    homeScore: normalizeNumber(record.homeScore),
    awayScore: normalizeNumber(record.awayScore),
  };
};

const mapBaseballMatchToMatchup = (
  record: Record<string, unknown>,
): MatchupSourceItem | null => {
  const score = mapBaseballMatchToScore(record);

  if (!score) {
    return null;
  }

  const venueRecord = readObject(record.venue);

  return {
    ...score,
    venue:
      normalizeString(record.venue) ??
      normalizeString(venueRecord?.displayName) ??
      normalizeString(venueRecord?.name) ??
      undefined,
  };
};

const mapBaseballStanding = (
  record: Record<string, unknown>,
  group: Record<string, unknown>,
): StandingSourceItem | null => {
  const team =
    normalizeString(record.displayName) ??
    normalizeString(record.name) ??
    normalizeString(readObject(record.team)?.displayName) ??
    normalizeString(readObject(record.team)?.name);

  if (!team) {
    return null;
  }

  const stats = Array.isArray(record.stats) ? record.stats : [];
  const statByAbbreviation = new Map<string, string>();

  for (const stat of stats) {
    const statRecord = readObject(stat);
    const abbreviation = normalizeString(statRecord?.abbreviation);
    const displayValue = normalizeString(statRecord?.displayValue);

    if (abbreviation && displayValue) {
      statByAbbreviation.set(abbreviation.toUpperCase(), displayValue);
    }
  }

  return {
    id: normalizeString(record.id) ?? team,
    sport: "baseball",
    team,
    rank: normalizeNumber(statByAbbreviation.get("RANK")) ?? null,
    wins: normalizeNumber(statByAbbreviation.get("W")) ?? null,
    losses:
      normalizeNumber(statByAbbreviation.get("L")) ??
      normalizeNumber(statByAbbreviation.get("LOS")) ??
      null,
    pointsFor:
      normalizeNumber(statByAbbreviation.get("RS")) ??
      normalizeNumber(statByAbbreviation.get("PF")) ??
      null,
    pointsAgainst:
      normalizeNumber(statByAbbreviation.get("RA")) ??
      normalizeNumber(statByAbbreviation.get("PA")) ??
      null,
    conference:
      normalizeString(group.abbreviation) ??
      normalizeString(group.leagueName) ??
      null,
    season: normalizeNumber(group.year),
  };
};

const mapHttpError = (error: unknown): never => {
  if (error instanceof SourceDataServiceError) {
    throw error;
  }

  if (error instanceof HttpClientError) {
    throw new SourceDataServiceError(
      "Failed to fetch external source data",
      error.status >= 400 && error.status < 500 ? 502 : 503,
    );
  }

  throw new SourceDataServiceError("Failed to fetch external source data", 503);
};

const resolveBaseballDate = (date?: string): string => date ?? nowIso().slice(0, 10);

const getFootballScores = async (
  query: SourceQuery,
): Promise<SourceResponse<ScoreSourceItem>> => {
  try {
    const response = await footballBasketballApiService.getFootball<unknown[]>(
      "/games",
      {
        year: query.year ?? currentYear(),
        week: query.week,
        team: query.team,
        conference: query.conference,
        seasonType: query.seasonType,
        classification: query.classification ?? "fbs",
      },
    );

    return {
      items: response
        .map((entry) => mapFootballGameToScore(readObject(entry) ?? {}))
        .filter((item): item is ScoreSourceItem => item !== null),
      source: buildMetadata("football", "collegefootballdata"),
    };
  } catch (error) {
    return mapHttpError(error);
  }
};

const getFootballMatchups = async (
  query: SourceQuery,
): Promise<SourceResponse<MatchupSourceItem>> => {
  try {
    const response = await footballBasketballApiService.getFootball<unknown[]>(
      "/games",
      {
        year: query.year ?? currentYear(),
        week: query.week,
        team: query.team,
        conference: query.conference,
        seasonType: query.seasonType,
        classification: query.classification ?? "fbs",
      },
    );

    return {
      items: response
        .map((entry) => mapFootballGameToMatchup(readObject(entry) ?? {}))
        .filter((item): item is MatchupSourceItem => item !== null),
      source: buildMetadata("football", "collegefootballdata"),
    };
  } catch (error) {
    return mapHttpError(error);
  }
};

const getFootballStandings = async (
  query: SourceQuery,
): Promise<SourceResponse<StandingSourceItem>> => {
  try {
    const response = await footballBasketballApiService.getFootball<unknown[]>(
      "/records",
      {
        year: query.year ?? currentYear(),
        team: query.team,
        conference: query.conference,
      },
    );

    return {
      items: response
        .map((entry) => mapFootballStanding(readObject(entry) ?? {}))
        .filter((item): item is StandingSourceItem => item !== null),
      source: buildMetadata("football", "collegefootballdata"),
    };
  } catch (error) {
    return mapHttpError(error);
  }
};

const getBaseballScores = async (
  query: SourceQuery,
): Promise<SourceResponse<ScoreSourceItem>> => {
  try {
    const response = await baseballApiService.get<unknown>("/matches", {
      date: resolveBaseballDate(query.date),
      limit: 100,
      offset: 0,
    });

    return {
      items: readArray<unknown>(response)
        .map((entry) => mapBaseballMatchToScore(readObject(entry) ?? {}))
        .filter((item): item is ScoreSourceItem => item !== null),
      source: buildMetadata("baseball", "highlightly-rapidapi"),
    };
  } catch (error) {
    return mapHttpError(error);
  }
};

const getBaseballMatchups = async (
  query: SourceQuery,
): Promise<SourceResponse<MatchupSourceItem>> => {
  try {
    const response = await baseballApiService.get<unknown>("/matches", {
      date: resolveBaseballDate(query.date),
      limit: 100,
      offset: 0,
    });

    return {
      items: readArray<unknown>(response)
        .map((entry) => mapBaseballMatchToMatchup(readObject(entry) ?? {}))
        .filter((item): item is MatchupSourceItem => item !== null),
      source: buildMetadata("baseball", "highlightly-rapidapi"),
    };
  } catch (error) {
    return mapHttpError(error);
  }
};

const getBaseballStandings = async (
  query: SourceQuery,
): Promise<SourceResponse<StandingSourceItem>> => {
  try {
    const response = await baseballApiService.get<unknown>("/standings", {
      abbreviation: query.conference ?? "NCAA",
      year: query.year ?? currentYear(),
      limit: 20,
      offset: 0,
    });

    const groups = readArray<Record<string, unknown>>(response);
    const items = groups.flatMap((group) => {
      const rows = Array.isArray(group.data) ? group.data : [];

      return rows
        .map((entry) => mapBaseballStanding(readObject(entry) ?? {}, group))
        .filter((item): item is StandingSourceItem => item !== null);
    });

    return {
      items,
      source: buildMetadata("baseball", "highlightly-rapidapi"),
    };
  } catch (error) {
    return mapHttpError(error);
  }
};

export const sourceDataService = {
  getScores(query: SourceQuery): Promise<SourceResponse<ScoreSourceItem>> {
    if (query.sport === "football") {
      return getFootballScores(query);
    }

    if (query.sport === "baseball") {
      return getBaseballScores(query);
    }

    return Promise.resolve(
      buildFallback(
        "basketball",
        "collegebasketballdata",
        "Basketball source scores are not wired yet. Provider route verification is still pending.",
      ),
    );
  },

  getMatchups(query: SourceQuery): Promise<SourceResponse<MatchupSourceItem>> {
    if (query.sport === "football") {
      return getFootballMatchups(query);
    }

    if (query.sport === "baseball") {
      return getBaseballMatchups(query);
    }

    return Promise.resolve(
      buildFallback(
        "basketball",
        "collegebasketballdata",
        "Basketball matchup source data is not wired yet. Provider route verification is still pending.",
      ),
    );
  },

  getStandings(query: SourceQuery): Promise<SourceResponse<StandingSourceItem>> {
    if (query.sport === "football") {
      return getFootballStandings(query);
    }

    if (query.sport === "baseball") {
      return getBaseballStandings(query);
    }

    return Promise.resolve(
      buildFallback(
        "basketball",
        "collegebasketballdata",
        "Basketball standings source data is not wired yet. Provider route verification is still pending.",
      ),
    );
  },
};
