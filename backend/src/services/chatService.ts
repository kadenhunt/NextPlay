import { createNotImplementedResponse } from "../lib/notImplemented";
import type { NotImplementedResponse } from "../types/notImplemented";

export const chatService = {
  listMessages(): NotImplementedResponse {
    return createNotImplementedResponse("chat", "listMessages");
  },

  postMessage(): NotImplementedResponse {
    return createNotImplementedResponse("chat", "postMessage");
  },
};
