import { leagueStore } from "../lib/leagueStore";
import { LeagueRequestError } from "./leaguesService";
import type { DraftState } from "../types/draft";

const requireValue = (value: string | undefined, fieldName: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new LeagueRequestError(`Query parameter ${fieldName} is required`, 400);
  }

  return trimmed;
};

export const draftService = {
  getDraftState(input: { leagueId?: string; userId?: string }): DraftState {
    const leagueId = requireValue(input.leagueId, "leagueId");
    const userId = requireValue(input.userId, "userId");
    const draftState = leagueStore.getDraftStateForUser(leagueId, userId);

    if (!draftState) {
      throw new LeagueRequestError("Draft state not found", 404);
    }

    return draftState;
  },
};
