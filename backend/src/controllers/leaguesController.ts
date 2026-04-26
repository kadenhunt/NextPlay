import type { Request, Response } from "express";

import { LeagueRequestError, leaguesService } from "../services/leaguesService";

const sendError = (response: Response, error: unknown): void => {
  if (error instanceof LeagueRequestError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Unexpected leagues error" });
};

export const listLeagues = (request: Request, response: Response): void => {
  try {
    const userId =
      typeof request.query.userId === "string" ? request.query.userId : undefined;
    response.status(200).json(leaguesService.listLeagues(userId));
  } catch (error) {
    sendError(response, error);
  }
};

export const getLeague = (request: Request, response: Response): void => {
  try {
    const userId =
      typeof request.query.userId === "string" ? request.query.userId : undefined;

    const leagueId = Array.isArray(request.params.leagueId)
      ? request.params.leagueId[0]
      : request.params.leagueId;

    response.status(200).json(leaguesService.getLeague(leagueId, userId));
  } catch (error) {
    sendError(response, error);
  }
};
