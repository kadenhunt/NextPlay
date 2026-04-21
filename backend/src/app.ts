import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { chatRouter } from "./routes/chat";
import { draftRouter } from "./routes/draft";
import { healthRouter } from "./routes/health";
import { leaguesRouter } from "./routes/leagues";
import { playersRouter } from "./routes/players";
import { sourceDataRouter } from "./routes/sourceData";
import { teamsRouter } from "./routes/teams";

export const app = express();
app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/draft", draftRouter);
app.use("/api/leagues", leaguesRouter);
app.use("/api/players", playersRouter);
app.use("/api/source-data", sourceDataRouter);
app.use("/api/teams", teamsRouter);
