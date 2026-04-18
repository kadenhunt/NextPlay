import express from "express";

import { healthRouter } from "./routes/health";
import { playersRouter } from "./routes/players";
import { sourceDataRouter } from "./routes/sourceData";

export const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/players", playersRouter);
app.use("/api/source-data", sourceDataRouter);
