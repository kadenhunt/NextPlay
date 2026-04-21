import { Router } from "express";

import { listMessages, postMessage } from "../controllers/chatController";

export const chatRouter = Router();

chatRouter.get("/messages", listMessages);
chatRouter.post("/messages", postMessage);
