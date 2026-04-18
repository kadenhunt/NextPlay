import { Router } from "express";

import { getDraftState } from "../controllers/draftController";

export const draftRouter = Router();

draftRouter.get("/state", getDraftState);
