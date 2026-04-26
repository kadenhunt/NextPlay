import type { FantasyTeam } from "./leagues";

export type DraftPick = {
  overallPick: number;
  round: number;
  pickInRound: number;
  teamId: string;
  playerId: string;
  teamName: string;
  playerName: string;
  pickedByUserId: string;
  isAuto: boolean;
  pickedAt: string;
};

export type DraftState = {
  leagueId: string;
  status: "DRAFT_SCHEDULED" | "DRAFT_IN_PROGRESS" | "COMPLETE";
  draftType: "snake" | "auto";
  currentOverallPick: number;
  currentRound: number;
  currentPickInRound: number;
  currentTeamId: string;
  currentTeamName: string;
  autoDraftTeamIds: string[];
  timerEndsAt: string;
  picks: DraftPick[];
  isCurrentUserTurn: boolean;
};

export type TeamState = {
  leagueId: string;
  team: FantasyTeam;
  isLineupLocked: boolean;
  rosterCap: number;
};
