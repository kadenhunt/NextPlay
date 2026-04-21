import type { Request, Response } from "express";

import { leaguesService } from "../services/leaguesService";

const NOT_IMPLEMENTED_STATUS = 501;

export const listLeagues = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(leaguesService.listLeagues());
};

export const getLeague = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(leaguesService.getLeague());
};
