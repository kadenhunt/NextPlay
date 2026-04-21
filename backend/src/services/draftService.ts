import { createNotImplementedResponse } from "../lib/notImplemented";
import type { NotImplementedResponse } from "../types/notImplemented";

export const draftService = {
  getDraftState(): NotImplementedResponse {
    return createNotImplementedResponse("draft", "getDraftState");
  },
};
