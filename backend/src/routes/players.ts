import { Router } from "express";

import { getPlayerById, listPlayers } from "../controllers/playersController";

export const playersRouter = Router();

playersRouter.get("/", listPlayers);
playersRouter.get("/:playerId", getPlayerById);
