import express from "express";

import { healthRouter } from "./routes/health";
import { playersRouter } from "./routes/players";

export const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/players", playersRouter);
