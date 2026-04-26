import type { Request, Response } from "express";

import { LeagueRequestError } from "../services/leaguesService";
import { chatService } from "../services/chatService";

const sendError = (response: Response, error: unknown): void => {
  if (error instanceof LeagueRequestError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: "Unexpected chat error" });
};

export const listMessages = (request: Request, response: Response): void => {
  try {
    const leagueId =
      typeof request.query.leagueId === "string" ? request.query.leagueId : undefined;
    const userId =
      typeof request.query.userId === "string" ? request.query.userId : undefined;

    response.status(200).json(chatService.listMessages({ leagueId, userId }));
  } catch (error) {
    sendError(response, error);
  }
};

export const postMessage = (request: Request, response: Response): void => {
  try {
    const body = request.body as {
      leagueId?: string;
      userId?: string;
      text?: string;
    };

    response.status(200).json(
      chatService.postMessage({
        leagueId: typeof body.leagueId === "string" ? body.leagueId : undefined,
        userId: typeof body.userId === "string" ? body.userId : undefined,
        text: typeof body.text === "string" ? body.text : undefined,
      }),
    );
  } catch (error) {
    sendError(response, error);
  }
};
