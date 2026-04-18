import { Router } from "express";

import { getSession, login, register } from "../controllers/authController";

export const authRouter = Router();

authRouter.get("/session", getSession);
authRouter.post("/login", login);
authRouter.post("/register", register);
