import { Router } from "express";

import { getLeague, listLeagues } from "../controllers/leaguesController";

export const leaguesRouter = Router();

leaguesRouter.get("/", listLeagues);
leaguesRouter.get("/:leagueId", getLeague);
