import type { Request, Response } from "express";

import { leagueContractService } from "../services/leagueContractService";
import { PlayersServiceError } from "../services/playersService";
import { SourceDataServiceError } from "../services/sourceDataService";
import type { PlayerQuery, PlayerStatus, SupportedSport } from "../types/players";

const validSports: SupportedSport[] = ["football", "basketball", "baseball"];
const validStatuses: PlayerStatus[] = ["ACTIVE", "INJURED", "OUT"];
const validDraftedValues: Array<NonNullable<PlayerQuery["drafted"]>> = [
  "any",
  "available",
  "drafted",
];
const validSortValues: Array<NonNullable<PlayerQuery["sort"]>> = [
  "projectedPoints_desc",
  "name_asc",
];

const parseString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const parseSport = (value: unknown): SupportedSport => {
  const sport = parseString(value);

  if (!sport || !validSports.includes(sport as SupportedSport)) {
    throw new SourceDataServiceError(
      "Query parameter sport must be one of: football, basketball, baseball",
      400,
    );
  }

  return sport as SupportedSport;
};

const parseInteger = (value: unknown, fieldName: string): number | undefined => {
  const raw = parseString(value);

  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed)) {
    throw new SourceDataServiceError(
      `Query parameter ${fieldName} must be a valid integer`,
      400,
    );
  }

  return parsed;
};

const parseStatus = (value: unknown): PlayerStatus | undefined => {
  const status = parseString(value);

  if (!status) {
    return undefined;
  }

  if (!validStatuses.includes(status as PlayerStatus)) {
    throw new PlayersServiceError(
      "Query parameter status must be one of: ACTIVE, INJURED, OUT",
      400,
    );
  }

  return status as PlayerStatus;
};

const parseDrafted = (value: unknown): PlayerQuery["drafted"] => {
  const drafted = parseString(value);

  if (!drafted) {
    return undefined;
  }

  if (!validDraftedValues.includes(drafted as NonNullable<PlayerQuery["drafted"]>)) {
    throw new PlayersServiceError(
      "Query parameter drafted must be one of: any, available, drafted",
      400,
    );
  }

  return drafted as PlayerQuery["drafted"];
};

const parseSort = (value: unknown): PlayerQuery["sort"] => {
  const sort = parseString(value);

  if (!sort) {
    return undefined;
  }

  if (!validSortValues.includes(sort as NonNullable<PlayerQuery["sort"]>)) {
    throw new PlayersServiceError(
      "Query parameter sort must be one of: projectedPoints_desc, name_asc",
      400,
    );
  }

  return sort as PlayerQuery["sort"];
};

const sendError = (response: Response, error: unknown): void => {
  if (
    error instanceof PlayersServiceError ||
    error instanceof SourceDataServiceError
  ) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Unexpected league contract error" });
};

const buildContext = (request: Request) => ({
  leagueId: (() => {
    const leagueId = parseString(request.params.leagueId);

    if (!leagueId) {
      throw new SourceDataServiceError("League id is required", 400);
    }

    return leagueId;
  })(),
  userId: parseString(request.query.userId),
  sport: parseSport(request.query.sport),
});

export const getLeaguePlayers = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const players = await leagueContractService.getPlayers(buildContext(request), {
      search: parseString(request.query.search),
      position: parseString(request.query.position),
      team: parseString(request.query.team),
      status: parseStatus(request.query.status),
      drafted: parseDrafted(request.query.drafted),
      sort: parseSort(request.query.sort),
      year: parseInteger(request.query.year, "year"),
    });

    response.status(200).json(players);
  } catch (error) {
    sendError(response, error);
  }
};

export const getLeaguePlayerById = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const playerId = parseString(request.params.playerId);

    if (!playerId) {
      throw new PlayersServiceError("Player id is required", 400);
    }

    const player = await leagueContractService.getPlayerById(
      buildContext(request),
      playerId,
    );

    response.status(200).json(player);
  } catch (error) {
    sendError(response, error);
  }
};

export const getLeagueMatchups = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const week = parseInteger(request.query.week, "week");

    if (!week) {
      throw new SourceDataServiceError("Query parameter week is required", 400);
    }

    const matchups = await leagueContractService.getMatchups(buildContext(request), {
      week,
      year: parseInteger(request.query.year, "year"),
    });

    response.status(200).json(matchups);
  } catch (error) {
    sendError(response, error);
  }
};

export const getLeagueStandings = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const standings = await leagueContractService.getStandings(buildContext(request), {
      year: parseInteger(request.query.year, "year"),
    });

    response.status(200).json(standings);
  } catch (error) {
    sendError(response, error);
  }
};
