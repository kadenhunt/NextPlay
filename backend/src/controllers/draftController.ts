import type { Request, Response } from "express";

import { draftService } from "../services/draftService";

const NOT_IMPLEMENTED_STATUS = 501;

export const getDraftState = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(draftService.getDraftState());
};
