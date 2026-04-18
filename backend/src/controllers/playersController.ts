import type { Request, Response } from "express";

import { playersService, PlayersServiceError } from "../services/playersService";
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

const parseYear = (value: unknown): number | undefined => {
  const raw = parseString(value);

  if (!raw) {
    return undefined;
  }

  const year = Number(raw);

  if (!Number.isInteger(year) || year < 1900) {
    throw new PlayersServiceError("Query parameter year must be a valid integer", 400);
  }

  return year;
};

const parseSport = (value: unknown): SupportedSport => {
  const sport = parseString(value);

  if (!sport || !validSports.includes(sport as SupportedSport)) {
    throw new PlayersServiceError(
      "Query parameter sport must be one of: football, basketball, baseball",
      400,
    );
  }

  return sport as SupportedSport;
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
  if (error instanceof PlayersServiceError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Unexpected players error" });
};

export const listPlayers = async (request: Request, response: Response): Promise<void> => {
  try {
    const query: PlayerQuery = {
      sport: parseSport(request.query.sport),
      search: parseString(request.query.search),
      position: parseString(request.query.position),
      team: parseString(request.query.team),
      status: parseStatus(request.query.status),
      drafted: parseDrafted(request.query.drafted),
      sort: parseSort(request.query.sort),
      year: parseYear(request.query.year),
    };

    const players = await playersService.listPlayers(query);

    response.status(200).json(players);
  } catch (error) {
    sendError(response, error);
  }
};

export const getPlayerById = async (request: Request, response: Response): Promise<void> => {
  try {
    const playerId = parseString(request.params.playerId);

    if (!playerId) {
      throw new PlayersServiceError("Player id is required", 400);
    }

    const player = await playersService.getPlayerById(playerId);

    response.status(200).json(player);
  } catch (error) {
    sendError(response, error);
  }
};
