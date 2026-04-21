import { createNotImplementedResponse } from "../lib/notImplemented";
import type { NotImplementedResponse } from "../types/notImplemented";

export const teamsService = {
  listTeams(): NotImplementedResponse {
    return createNotImplementedResponse("teams", "listTeams");
  },

  getTeam(): NotImplementedResponse {
    return createNotImplementedResponse("teams", "getTeam");
  },
};
