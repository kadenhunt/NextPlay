import { leagueStore } from "../lib/leagueStore";
import type { League } from "../types/leagues";

export class LeagueRequestError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "LeagueRequestError";
    this.statusCode = statusCode;
  }
}

const requireUserId = (userId?: string): string => {
  const trimmed = userId?.trim();
  if (!trimmed) {
    throw new LeagueRequestError("Query parameter userId is required", 400);
  }

  return trimmed;
};

export const leaguesService = {
  listLeagues(userId?: string): League[] {
    return leagueStore.listLeaguesForUser(requireUserId(userId));
  },

  getLeague(leagueId: string, userId?: string): League {
    const league = leagueStore.getLeagueForUser(leagueId, requireUserId(userId));
    if (!league) {
      throw new LeagueRequestError("League not found", 404);
    }

    return league;
  },
};
