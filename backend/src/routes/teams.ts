import { Router } from "express";

import { getMyTeamState, getTeam, listTeams } from "../controllers/teamsController";

export const teamsRouter = Router();

teamsRouter.get("/", listTeams);
teamsRouter.get("/my-state", getMyTeamState);
teamsRouter.get("/:teamId", getTeam);
