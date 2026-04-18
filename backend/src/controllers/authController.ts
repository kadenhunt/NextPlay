import type { Request, Response } from "express";

import { authService } from "../services/authService";

const NOT_IMPLEMENTED_STATUS = 501;

export const getSession = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(authService.getSession());
};

export const login = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(authService.login());
};

export const register = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(authService.register());
};
