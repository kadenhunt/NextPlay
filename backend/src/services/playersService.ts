import { baseballApiService } from "./baseballApiService";
import { footballBasketballApiService } from "./footballBasketballApiService";
import type {
  ExternalBaseballAthlete,
  ExternalCollegeAthlete,
} from "../types/externalApi";
import type {
  Player,
  PlayerQuery,
  PlayerScoringBreakdown,
  PlayerStatus,
  ScoringLine,
  SupportedSport,
} from "../types/players";
import { HttpClientError } from "../lib/httpClient";

type PlayerTokenPayload = {
  sport: SupportedSport;
  externalId?: string;
  name: string;
  team: string;
  position: string;
  year?: number;
};

type PlayerSeed = PlayerTokenPayload & {
  status: PlayerStatus;
};

const DEFAULT_STATUS: PlayerStatus = "ACTIVE";
const DEFAULT_SORT = "projectedPoints_desc";

const footballProjectionByPosition: Record<string, number> = {
  QB: 22.4,
  RB: 16.8,
  WR: 15.1,
  TE: 11.4,
  K: 8.3,
  DL: 9.1,
  LB: 10.6,
  DB: 9.8,
};

const basketballProjectionByPosition: Record<string, number> = {
  G: 28.2,
  PG: 30.1,
  SG: 27.4,
  SF: 26.9,
  PF: 28.6,
  C: 29.5,
};

const baseballProjectionByPosition: Record<string, number> = {
  SP: 19.8,
  RP: 13.1,
  C: 8.4,
  "1B": 10.9,
  "2B": 10.2,
  SS: 10.8,
  "3B": 10.6,
  OF: 11.3,
  UN: 8.8,
};

export class PlayersServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "PlayersServiceError";
    this.statusCode = statusCode;
  }
}

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeNumberString = (value: unknown): string | undefined => {
  if (typeof value === "number") {
    return String(value);
  }

  return normalizeString(value);
};

const readObject = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
};

const firstDefined = (...values: Array<string | undefined>): string | undefined =>
  values.find((value) => value !== undefined);

const firstNonEmpty = (
  ...values: Array<string | number | undefined | null>
): string | undefined => {
  for (const value of values) {
    const normalized =
      typeof value === "number" ? String(value) : normalizeString(value);

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

const hashString = (input: string): number => {
  let hash = 0;

  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
};

const getCurrentSeasonYear = (): number => new Date().getFullYear();

const buildPlayerId = (payload: PlayerTokenPayload): string =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const parsePlayerId = (playerId: string): PlayerTokenPayload => {
  try {
    const decoded = JSON.parse(
      Buffer.from(playerId, "base64url").toString("utf8"),
    ) as Partial<PlayerTokenPayload>;

    if (
      decoded &&
      (decoded.sport === "football" ||
        decoded.sport === "basketball" ||
        decoded.sport === "baseball") &&
      typeof decoded.name === "string" &&
      typeof decoded.team === "string" &&
      typeof decoded.position === "string"
    ) {
      return {
        sport: decoded.sport,
        externalId: normalizeString(decoded.externalId),
        name: decoded.name,
        team: decoded.team,
        position: decoded.position,
        year: typeof decoded.year === "number" ? decoded.year : undefined,
      };
    }
  } catch {
    // Invalid ids are handled below.
  }

  throw new PlayersServiceError("Player not found", 404);
};

const normalizeStatus = (value: unknown): PlayerStatus => {
  const statusObject = readObject(value);
  const raw = firstNonEmpty(
    normalizeString(value),
    normalizeString(statusObject?.abbreviation),
    normalizeString(statusObject?.type),
  );

  if (!raw) {
    return DEFAULT_STATUS;
  }

  const upper = raw.toUpperCase();

  if (upper.includes("OUT")) {
    return "OUT";
  }

  if (upper.includes("INJ") || upper.includes("QUESTIONABLE")) {
    return "INJURED";
  }

  return DEFAULT_STATUS;
};

const buildProjectedPoints = (sport: SupportedSport, position: string, seed: string): number => {
  const tables = {
    football: footballProjectionByPosition,
    basketball: basketballProjectionByPosition,
    baseball: baseballProjectionByPosition,
  };

  const base =
    tables[sport][position.toUpperCase()] ??
    (sport === "football" ? 10.2 : sport === "basketball" ? 24.5 : 9.7);
  const variance = (hashString(seed) % 60) / 10 - 3;

  return Math.round(Math.max(1, base + variance) * 10) / 10;
};

const countLine = (
  label: string,
  quantity: number,
  pointsPerUnit: number,
): ScoringLine => ({
  label,
  quantity,
  pointsPerUnit,
  points: Math.round(quantity * pointsPerUnit * 10) / 10,
});

const yardsLine = (
  label: string,
  quantity: number,
  yardsDivisor: number,
  pointsPerUnit: number,
): ScoringLine => ({
  label,
  quantity,
  yardsDivisor,
  pointsPerUnit,
  points: Math.round((quantity / yardsDivisor) * pointsPerUnit * 10) / 10,
});

const buildScoringBreakdown = (
  sport: SupportedSport,
  position: string,
  projectedPoints: number,
): PlayerScoringBreakdown => {
  const upperPosition = position.toUpperCase();
  let lines: ScoringLine[];

  if (sport === "football") {
    if (upperPosition === "QB") {
      lines = [
        yardsLine("Passing yards", 245, 25, 1),
        countLine("Pass TD", 2, 4),
        yardsLine("Rushing yards", 28, 10, 1),
      ];
    } else if (upperPosition === "RB") {
      lines = [
        yardsLine("Rushing yards", 87, 10, 1),
        countLine("Rush TD", 1, 6),
        countLine("Receptions", 3, 1),
      ];
    } else {
      lines = [
        yardsLine("Receiving yards", 76, 10, 1),
        countLine("Receptions", 5, 1),
        countLine("Rec TD", 1, 6),
      ];
    }
  } else if (sport === "basketball") {
    lines = [
      countLine("Points", 18, 1),
      countLine("Rebounds", 6, 1.2),
      countLine("Assists", 5, 1.5),
    ];
  } else if (upperPosition === "SP" || upperPosition === "RP") {
    lines = [
      countLine("Strikeouts", 6, 2),
      countLine("Innings pitched", 5, 1.4),
      countLine("Win", 1, 4),
    ];
  } else {
    lines = [
      countLine("Hits", 2, 3),
      countLine("Runs", 1, 2),
      countLine("RBI", 2, 2),
    ];
  }

  const total = Math.round(lines.reduce((sum, line) => sum + line.points, 0) * 10) / 10;

  if (Math.abs(total - projectedPoints) >= 0.1) {
    const adjustment = Math.round((projectedPoints - total) * 10) / 10;
    lines = [
      ...lines,
      {
        label: "Projection adjustment",
        quantity: 1,
        pointsPerUnit: adjustment,
        points: adjustment,
      },
    ];
  }

  return {
    fantasyTotal: projectedPoints,
    isProjected: true,
    lines,
  };
};

const toPlayer = (seed: PlayerSeed, includeBreakdown = false): Player => {
  const projectedPoints = buildProjectedPoints(
    seed.sport,
    seed.position,
    `${seed.sport}:${seed.externalId ?? seed.name}:${seed.team}`,
  );

  return {
    id: buildPlayerId({
      sport: seed.sport,
      externalId: seed.externalId,
      name: seed.name,
      team: seed.team,
      position: seed.position,
      year: seed.year,
    }),
    name: seed.name,
    position: seed.position,
    team: seed.team,
    status: seed.status,
    drafted: false,
    projectedPoints,
    ...(includeBreakdown
      ? {
          scoringBreakdown: buildScoringBreakdown(
            seed.sport,
            seed.position,
            projectedPoints,
          ),
        }
      : {}),
  };
};

const normalizeCollegeAthlete = (
  athlete: ExternalCollegeAthlete,
  sport: SupportedSport,
  year: number,
): PlayerSeed | null => {
  const athleteRecord = athlete as Record<string, unknown>;
  const teamObject = readObject(athleteRecord.team);
  const hometownObject = readObject(athleteRecord.homeTown);
  const composedName = firstDefined(
    normalizeString(athleteRecord.name),
    normalizeString(athleteRecord.fullName),
    [normalizeString(athleteRecord.firstName), normalizeString(athleteRecord.lastName)]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined,
  );
  const team = firstDefined(
    normalizeString(athleteRecord.school),
    normalizeString(athleteRecord.team),
    normalizeString(athleteRecord.teamName),
    normalizeString(teamObject?.school),
    normalizeString(teamObject?.location),
    normalizeString(hometownObject?.school),
  );
  const position = firstDefined(
    normalizeString(athleteRecord.position),
    normalizeString(athleteRecord.positionAbbreviation),
    normalizeString(readObject(athleteRecord.position)?.abbreviation),
    normalizeString(readObject(athleteRecord.position)?.name),
  );

  if (!composedName || !team || !position) {
    return null;
  }

  return {
    sport,
    externalId: normalizeNumberString(
      athleteRecord.id ?? athleteRecord.athleteId ?? athleteRecord.playerId,
    ),
    name: composedName,
    team,
    position,
    status: normalizeStatus(athleteRecord.injuryStatus ?? athleteRecord.status),
    year,
  };
};

const normalizeBaseballAthlete = (
  athlete: ExternalBaseballAthlete,
): PlayerSeed | null => {
  const athleteRecord = athlete as Record<string, unknown>;
  const profile = readObject(athleteRecord.profile);
  const positionObject = readObject(profile?.position);
  const teamObject = readObject(profile?.team);
  const name = firstDefined(
    normalizeString(athleteRecord.fullName),
    normalizeString(athleteRecord.name),
    normalizeString(profile?.fullName),
  );
  const team = firstDefined(
    normalizeString(teamObject?.displayName),
    normalizeString(teamObject?.name),
    normalizeString(athleteRecord.team),
    normalizeString(athleteRecord.school),
  );
  const position = firstDefined(
    normalizeString(positionObject?.abbreviation),
    normalizeString(positionObject?.main),
    normalizeString(athleteRecord.position),
  );

  if (!name) {
    return null;
  }

  return {
    sport: "baseball",
    externalId: normalizeNumberString(athleteRecord.id),
    name,
    team: team ?? "Unknown Team",
    position: position ?? "UN",
    status: normalizeStatus(profile?.isActive === false ? "OUT" : "ACTIVE"),
  };
};

const filterAndSortPlayers = (players: Player[], query: PlayerQuery): Player[] => {
  const search = normalizeString(query.search)?.toLowerCase();
  const team = normalizeString(query.team);
  const position = normalizeString(query.position);
  const status = query.status;

  let result = players.slice();

  if (search) {
    result = result.filter(
      (player) =>
        player.name.toLowerCase().includes(search) ||
        player.team.toLowerCase().includes(search),
    );
  }

  if (team) {
    result = result.filter((player) => player.team === team);
  }

  if (position) {
    result = result.filter((player) => player.position === position);
  }

  if (status) {
    result = result.filter((player) => player.status === status);
  }

  if (query.drafted === "drafted") {
    return [];
  }

  const sort = query.sort ?? DEFAULT_SORT;
  result.sort((left, right) => {
    if (sort === "name_asc") {
      return left.name.localeCompare(right.name);
    }

    return right.projectedPoints - left.projectedPoints;
  });

  return result;
};

const readArrayResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const record = readObject(payload);

  if (!record) {
    return [];
  }

  for (const key of ["data", "results", "players", "items"]) {
    if (Array.isArray(record[key])) {
      return record[key] as T[];
    }
  }

  return [];
};

const handleProviderError = (error: unknown): never => {
  if (error instanceof PlayersServiceError) {
    throw error;
  }

  if (error instanceof HttpClientError) {
    const isMissing = error.status === 404;
    throw new PlayersServiceError(
      isMissing
        ? "External player data was not found"
        : "Failed to fetch external player data",
      isMissing ? 404 : 502,
    );
  }

  throw new PlayersServiceError("Failed to fetch external player data", 502);
};

const listFootballPlayers = async (query: PlayerQuery): Promise<Player[]> => {
  const year = query.year ?? getCurrentSeasonYear();

  try {
    if (normalizeString(query.search)) {
      const response = await footballBasketballApiService.getFootball<
        ExternalCollegeAthlete[]
      >("/player/search", {
        searchTerm: query.search,
        year,
        team: query.team,
        position: query.position,
      });

      return filterAndSortPlayers(
        response
          .map((athlete) => normalizeCollegeAthlete(athlete, "football", year))
          .filter((player): player is PlayerSeed => player !== null)
          .map((player) => toPlayer(player)),
        query,
      );
    }

    const response = await footballBasketballApiService.getFootball<
      ExternalCollegeAthlete[]
    >("/roster", {
      year,
      team: query.team,
    });

    return filterAndSortPlayers(
      response
        .map((athlete) => normalizeCollegeAthlete(athlete, "football", year))
        .filter((player): player is PlayerSeed => player !== null)
        .map((player) => toPlayer(player)),
      query,
    );
  } catch (error) {
    return handleProviderError(error);
  }
};

const fetchBasketballRoster = async (
  team: string | undefined,
  season: number,
): Promise<PlayerSeed[]> => {
  const normalizedTeam = normalizeString(team);

  if (!normalizedTeam) {
    throw new PlayersServiceError(
      "Basketball player provider currently requires a team filter",
      501,
    );
  }

  const response = await footballBasketballApiService.getBasketball<unknown>(
    "/roster",
    {
      season,
      team: normalizedTeam,
    },
  );

  if (typeof response === "string") {
    throw new PlayersServiceError(
      "Basketball player provider returned unsupported roster data",
      502,
    );
  }

  return readArrayResponse<ExternalCollegeAthlete>(response)
    .map((athlete) => normalizeCollegeAthlete(athlete, "basketball", season))
    .filter((player): player is PlayerSeed => player !== null);
};

const listBasketballPlayers = async (query: PlayerQuery): Promise<Player[]> => {
  const year = query.year ?? getCurrentSeasonYear();

  try {
    const rosterResponse = await fetchBasketballRoster(query.team, year);

    return filterAndSortPlayers(
      rosterResponse
        .map((player) => toPlayer(player)),
      query,
    );
  } catch (error) {
    return handleProviderError(error);
  }
};

const listBaseballPlayers = async (query: PlayerQuery): Promise<Player[]> => {
  try {
    const response = await baseballApiService.get<unknown>("/players", {
      name: query.search,
      limit: 200,
      offset: 0,
    });

    return filterAndSortPlayers(
      readArrayResponse<ExternalBaseballAthlete>(response)
        .map((athlete) => normalizeBaseballAthlete(athlete))
        .filter((player): player is PlayerSeed => player !== null)
        .map((player) => toPlayer(player)),
      query,
    );
  } catch (error) {
    return handleProviderError(error);
  }
};

const listPlayersBySport = (query: PlayerQuery): Promise<Player[]> => {
  if (query.sport === "football") {
    return listFootballPlayers(query);
  }

  if (query.sport === "basketball") {
    return listBasketballPlayers(query);
  }

  return listBaseballPlayers(query);
};

const refetchFootballPlayer = async (payload: PlayerTokenPayload): Promise<PlayerSeed> => {
  const year = payload.year ?? getCurrentSeasonYear();

  if (payload.externalId && payload.team) {
    try {
      const roster = await footballBasketballApiService.getFootball<
        ExternalCollegeAthlete[]
      >("/roster", {
        year,
        team: payload.team,
      });
      const exact = roster
        .map((athlete) => normalizeCollegeAthlete(athlete, "football", year))
        .find((player) => player?.externalId === payload.externalId);

      if (exact) {
        return exact;
      }
    } catch {
      // Fall back to search below.
    }
  }

  try {
    const matches = await footballBasketballApiService.getFootball<
      ExternalCollegeAthlete[]
    >("/player/search", {
      searchTerm: payload.name,
      year,
      team: payload.team,
      position: payload.position,
    });
    const exact = matches
      .map((athlete) => normalizeCollegeAthlete(athlete, "football", year))
      .find(
        (player) =>
          player &&
          player.name === payload.name &&
          player.team === payload.team &&
          player.position === payload.position,
      );

    if (exact) {
      return exact;
    }
  } catch {
    // Fall through to the encoded payload.
  }

  return {
    sport: "football",
    externalId: payload.externalId,
    name: payload.name,
    team: payload.team,
    position: payload.position,
    status: DEFAULT_STATUS,
    year,
  };
};

const refetchBasketballPlayer = async (payload: PlayerTokenPayload): Promise<PlayerSeed> => {
  const year = payload.year ?? getCurrentSeasonYear();

  try {
    const roster = await fetchBasketballRoster(payload.team, year);
    const exact = roster
      .find(
        (player) =>
          player &&
          player.name === payload.name &&
          player.team === payload.team &&
          player.position === payload.position,
      );

    if (exact) {
      return exact;
    }
  } catch {
    // Fall through to the encoded payload.
  }

  return {
    sport: "basketball",
    externalId: payload.externalId,
    name: payload.name,
    team: payload.team,
    position: payload.position,
    status: DEFAULT_STATUS,
    year,
  };
};

const refetchBaseballPlayer = async (payload: PlayerTokenPayload): Promise<PlayerSeed> => {
  if (payload.externalId) {
    try {
      const response = await baseballApiService.get<unknown>(
        `/players/${payload.externalId}`,
      );
      const exact = readArrayResponse<ExternalBaseballAthlete>(response)
        .map((athlete) => normalizeBaseballAthlete(athlete))
        .find((player) => player !== null);

      if (exact) {
        return exact;
      }
    } catch {
      // Fall through to encoded payload.
    }
  }

  return {
    sport: "baseball",
    externalId: payload.externalId,
    name: payload.name,
    team: payload.team,
    position: payload.position,
    status: DEFAULT_STATUS,
  };
};

export const playersService = {
  async listPlayers(query: PlayerQuery): Promise<Player[]> {
    return listPlayersBySport(query);
  },

  async getPlayerById(playerId: string): Promise<Player> {
    const payload = parsePlayerId(playerId);

    try {
      if (payload.sport === "football") {
        return toPlayer(await refetchFootballPlayer(payload), true);
      }

      if (payload.sport === "basketball") {
        return toPlayer(await refetchBasketballPlayer(payload), true);
      }

      return toPlayer(await refetchBaseballPlayer(payload), true);
    } catch (error) {
      return handleProviderError(error);
    }
  },
};
