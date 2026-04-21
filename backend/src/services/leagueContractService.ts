import { playersService } from "./playersService";
import {
  sourceDataService,
  SourceDataServiceError,
} from "./sourceDataService";
import type { PlayerQuery, SupportedSport } from "../types/players";
import type {
  FrontendMatchup,
  FrontendMatchupStatus,
  FrontendPlayer,
  FrontendStandingRow,
} from "../types/frontendContract";
import type {
  MatchupSourceItem,
  SourceSport,
  StandingSourceItem,
} from "../types/sourceData";

type LeagueContractContext = {
  leagueId: string;
  userId?: string;
  sport: SupportedSport;
};

type LeaguePlayersQuery = Omit<PlayerQuery, "sport">;

const normalizeStatus = (status: string): FrontendMatchupStatus => {
  const upper = status.toUpperCase();

  if (upper.includes("FINAL") || upper.includes("FINISH")) {
    return "FINAL";
  }

  if (upper.includes("LIVE") || upper.includes("PROGRESS")) {
    return "LIVE";
  }

  return "UPCOMING";
};

const toTeamId = (teamName: string): string =>
  `team_${teamName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;

const sortStandings = (rows: FrontendStandingRow[]): FrontendStandingRow[] =>
  rows
    .slice()
    .sort(
      (left, right) =>
        right.wins - left.wins ||
        right.pointsFor - left.pointsFor ||
        left.pointsAgainst - right.pointsAgainst ||
        left.teamName.localeCompare(right.teamName),
    )
    .map((row, index) => ({
      ...row,
      rank: row.rank > 0 ? row.rank : index + 1,
    }));

const mapMatchup = (
  sourceItem: MatchupSourceItem,
  requestedWeek?: number,
): FrontendMatchup => ({
  id: sourceItem.id,
  week: sourceItem.week ?? requestedWeek ?? 1,
  homeTeamId: toTeamId(sourceItem.homeTeam),
  awayTeamId: toTeamId(sourceItem.awayTeam),
  homeTeamName: sourceItem.homeTeam,
  awayTeamName: sourceItem.awayTeam,
  status: normalizeStatus(sourceItem.status),
  ...(sourceItem.homeScore != null ? { homeScore: sourceItem.homeScore } : {}),
  ...(sourceItem.awayScore != null ? { awayScore: sourceItem.awayScore } : {}),
});

const mapStanding = (sourceItem: StandingSourceItem): FrontendStandingRow => ({
  teamId: sourceItem.id || toTeamId(sourceItem.team),
  teamName: sourceItem.team,
  rank: sourceItem.rank ?? 0,
  wins: sourceItem.wins ?? 0,
  losses: sourceItem.losses ?? 0,
  pointsFor: sourceItem.pointsFor ?? 0,
  pointsAgainst: sourceItem.pointsAgainst ?? 0,
});

const toSourceSport = (sport: SupportedSport): SourceSport => sport;

export const leagueContractService = {
  async getPlayers(
    context: LeagueContractContext,
    query: LeaguePlayersQuery,
  ): Promise<FrontendPlayer[]> {
    void context.leagueId;
    void context.userId;

    return playersService.listPlayers({
      ...query,
      sport: context.sport,
    });
  },

  async getPlayerById(
    context: LeagueContractContext,
    playerId: string,
  ): Promise<FrontendPlayer> {
    void context.leagueId;
    void context.userId;

    return playersService.getPlayerById(playerId);
  },

  async getMatchups(
    context: LeagueContractContext,
    options: { week: number; year?: number },
  ): Promise<FrontendMatchup[]> {
    const payload = await sourceDataService.getMatchups({
      sport: toSourceSport(context.sport),
      week: options.week,
      year: options.year,
    });

    return payload.items.map((item) => mapMatchup(item, options.week));
  },

  async getStandings(
    context: LeagueContractContext,
    options: { year?: number },
  ): Promise<FrontendStandingRow[]> {
    const payload = await sourceDataService.getStandings({
      sport: toSourceSport(context.sport),
      year: options.year,
    });

    if (payload.source.fallbackUsed) {
      throw new SourceDataServiceError(
        payload.source.message ?? "Standings are not available for this sport yet",
        501,
      );
    }

    return sortStandings(payload.items.map(mapStanding));
  },
};
