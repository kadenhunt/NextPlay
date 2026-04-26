import type { Request, Response } from "express";

import { LeagueRequestError } from "../services/leaguesService";
import { teamsService } from "../services/teamsService";

const sendError = (response: Response, error: unknown): void => {
  if (error instanceof LeagueRequestError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Unexpected teams error" });
};

export const listTeams = (request: Request, response: Response): void => {
  try {
    const userId =
      typeof request.query.userId === "string" ? request.query.userId : undefined;
    const leagueId =
      typeof request.query.leagueId === "string" ? request.query.leagueId : undefined;

    response.status(200).json(teamsService.listTeams({ userId, leagueId }));
  } catch (error) {
    sendError(response, error);
  }
};

export const getMyTeamState = (request: Request, response: Response): void => {
  try {
    const userId =
      typeof request.query.userId === "string" ? request.query.userId : undefined;
    const leagueId =
      typeof request.query.leagueId === "string" ? request.query.leagueId : undefined;

    response.status(200).json(teamsService.getMyTeamState({ userId, leagueId }));
  } catch (error) {
    sendError(response, error);
  }
};

export const getTeam = (request: Request, response: Response): void => {
  try {
    const userId =
      typeof request.query.userId === "string" ? request.query.userId : undefined;

    const teamId = Array.isArray(request.params.teamId)
      ? request.params.teamId[0]
      : request.params.teamId;

    response.status(200).json(teamsService.getTeam(teamId, userId));
  } catch (error) {
    sendError(response, error);
  }
};
