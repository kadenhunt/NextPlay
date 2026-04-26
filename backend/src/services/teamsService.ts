import { leagueStore } from "../lib/leagueStore";
import { LeagueRequestError } from "./leaguesService";
import type { TeamState } from "../types/draft";
import type { TeamSummary } from "../types/leagues";

const requireUserId = (userId?: string): string => {
  const trimmed = userId?.trim();
  if (!trimmed) {
    throw new LeagueRequestError("Query parameter userId is required", 400);
  }

  return trimmed;
};

export const teamsService = {
  listTeams(input: { userId?: string; leagueId?: string }): TeamSummary[] {
    const userId = requireUserId(input.userId);
    const leagueId = input.leagueId?.trim();

    if (leagueId && !leagueStore.userHasLeagueAccess(leagueId, userId)) {
      throw new LeagueRequestError("League not found", 404);
    }

    return leagueStore.listTeamsForUser(userId, leagueId);
  },

  getTeam(teamId: string, userId?: string): TeamSummary {
    const team = leagueStore.getTeamForUser(teamId, requireUserId(userId));
    if (!team) {
      throw new LeagueRequestError("Team not found", 404);
    }

    return team;
  },

  getMyTeamState(input: { leagueId?: string; userId?: string }): TeamState {
    const userId = requireUserId(input.userId);
    const leagueId = input.leagueId?.trim();

    if (!leagueId) {
      throw new LeagueRequestError("Query parameter leagueId is required", 400);
    }

    const teamState = leagueStore.getMyTeamStateForUser(leagueId, userId);
    if (!teamState) {
      throw new LeagueRequestError("Team state not found", 404);
    }

    return teamState;
  },
};
