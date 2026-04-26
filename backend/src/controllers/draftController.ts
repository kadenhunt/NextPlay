import type { Request, Response } from "express";

import { LeagueRequestError } from "../services/leaguesService";
import { draftService } from "../services/draftService";

const sendError = (response: Response, error: unknown): void => {
  if (error instanceof LeagueRequestError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Unexpected draft error" });
};

export const getDraftState = (request: Request, response: Response): void => {
  try {
    const leagueId =
      typeof request.query.leagueId === "string" ? request.query.leagueId : undefined;
    const userId =
      typeof request.query.userId === "string" ? request.query.userId : undefined;

    response.status(200).json(draftService.getDraftState({ leagueId, userId }));
  } catch (error) {
    sendError(response, error);
  }
};
