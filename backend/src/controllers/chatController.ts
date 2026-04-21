import type { Request, Response } from "express";

import { chatService } from "../services/chatService";

const NOT_IMPLEMENTED_STATUS = 501;

export const listMessages = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(chatService.listMessages());
};

export const postMessage = (_request: Request, response: Response): void => {
  response.status(NOT_IMPLEMENTED_STATUS).json(chatService.postMessage());
};
