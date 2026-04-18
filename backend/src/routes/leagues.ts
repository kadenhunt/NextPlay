import { Router } from "express";

import { getLeague, listLeagues } from "../controllers/leaguesController";
import {
  getLeagueMatchups,
  getLeaguePlayerById,
  getLeaguePlayers,
  getLeagueStandings,
} from "../controllers/leagueContractController";

export const leaguesRouter = Router();

leaguesRouter.get("/", listLeagues);
leaguesRouter.get("/:leagueId", getLeague);
leaguesRouter.get("/:leagueId/players", getLeaguePlayers);
leaguesRouter.get("/:leagueId/players/:playerId", getLeaguePlayerById);
leaguesRouter.get("/:leagueId/matchups", getLeagueMatchups);
leaguesRouter.get("/:leagueId/standings", getLeagueStandings);
