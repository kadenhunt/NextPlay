import { Router } from "express";

import { getSession, login, logout, register } from "../controllers/authController";

export const authRouter = Router();

authRouter.get("/session", getSession);
authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/logout", logout);
