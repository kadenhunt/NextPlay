import { Router } from "express";

import { getTeam, listTeams } from "../controllers/teamsController";

export const teamsRouter = Router();

teamsRouter.get("/", listTeams);
teamsRouter.get("/:teamId", getTeam);
