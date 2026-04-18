import type { Player } from "./players";

export type FrontendMatchupStatus = "UPCOMING" | "LIVE" | "FINAL";

export type FrontendMatchup = {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  status: FrontendMatchupStatus;
  homeScore?: number;
  awayScore?: number;
  homeProjected?: number;
  awayProjected?: number;
};

export type FrontendStandingRow = {
  teamId: string;
  teamName: string;
  rank: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
};

export type FrontendPlayer = Player;
