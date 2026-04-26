export type LeagueState =
  | "CREATED"
  | "DRAFT_SCHEDULED"
  | "DRAFT_IN_PROGRESS"
  | "SEASON_ACTIVE"
  | "PLAYOFFS"
  | "COMPLETE";

export type LeagueRole = "MEMBER" | "COMMISSIONER";

export type LeagueMember = {
  userId: string;
  role: LeagueRole;
  displayName: string;
};

export type League = {
  id: string;
  name: string;
  sport: "football" | "basketball" | "baseball";
  state: LeagueState;
  inviteCode: string;
  members: LeagueMember[];
  role: LeagueRole;
};

export type FantasyTeam = {
  id: string;
  name: string;
  ownerUserId: string;
  rosterPlayerIds: string[];
  lineup: {
    starters: string[];
    bench: string[];
  };
  lineupLockAt: string;
};

export type TeamSummary = FantasyTeam & {
  leagueId: string;
};

