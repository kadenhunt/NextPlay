import { createNotImplementedResponse } from "../lib/notImplemented";
import type { NotImplementedResponse } from "../types/notImplemented";

export const leaguesService = {
  listLeagues(): NotImplementedResponse {
    return createNotImplementedResponse("leagues", "listLeagues");
  },

  getLeague(): NotImplementedResponse {
    return createNotImplementedResponse("leagues", "getLeague");
  },
};
