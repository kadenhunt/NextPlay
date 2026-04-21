import type { Request, Response } from "express";

import {
  sourceDataService,
  SourceDataServiceError,
} from "../services/sourceDataService";
import type { SourceQuery, SourceSport } from "../types/sourceData";

const validSports: SourceSport[] = ["football", "basketball", "baseball"];

const parseString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
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

const parseSport = (value: unknown): SourceSport => {
  const sport = parseString(value);

  if (!sport || !validSports.includes(sport as SourceSport)) {
    throw new SourceDataServiceError(
      "Query parameter sport must be one of: football, basketball, baseball",
      400,
    );
  }

  return sport as SourceSport;
};

const parseDate = (value: unknown): string | undefined => {
  const date = parseString(value);

  if (!date) {
    return undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new SourceDataServiceError(
      "Query parameter date must use YYYY-MM-DD format",
      400,
    );
  }

  return date;
};

const buildQuery = (request: Request): SourceQuery => ({
  sport: parseSport(request.query.sport),
  year: parseInteger(request.query.year, "year"),
  week: parseInteger(request.query.week, "week"),
  team: parseString(request.query.team),
  conference: parseString(request.query.conference),
  seasonType: parseString(request.query.seasonType),
  classification: parseString(request.query.classification),
  date: parseDate(request.query.date),
});

const sendError = (response: Response, error: unknown): void => {
  if (error instanceof SourceDataServiceError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Unexpected source data error" });
};

export const getScores = async (request: Request, response: Response): Promise<void> => {
  try {
    const payload = await sourceDataService.getScores(buildQuery(request));
    response.status(200).json(payload);
  } catch (error) {
    sendError(response, error);
  }
};

export const getMatchups = async (request: Request, response: Response): Promise<void> => {
  try {
    const payload = await sourceDataService.getMatchups(buildQuery(request));
    response.status(200).json(payload);
  } catch (error) {
    sendError(response, error);
  }
};

export const getStandings = async (request: Request, response: Response): Promise<void> => {
  try {
    const payload = await sourceDataService.getStandings(buildQuery(request));
    response.status(200).json(payload);
  } catch (error) {
    sendError(response, error);
  }
};
