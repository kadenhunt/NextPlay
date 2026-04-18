import { Router } from "express";

import {
  getMatchups,
  getScores,
  getStandings,
} from "../controllers/sourceDataController";

export const sourceDataRouter = Router();

sourceDataRouter.get("/scores", getScores);
sourceDataRouter.get("/matchups", getMatchups);
sourceDataRouter.get("/standings", getStandings);
