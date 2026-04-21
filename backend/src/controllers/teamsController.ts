import type { Request, Response } from "express";

import { teamsService } from "../services/teamsService";

const NOT_IMPLEMENTED_STATUS = 501;

export const listTeams = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(teamsService.listTeams());
};

export const getTeam = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(teamsService.getTeam());
};
