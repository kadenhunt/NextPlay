export type SourceSport = "football" | "basketball" | "baseball";

export type SourceMetadata = {
  sport: SourceSport;
  provider: string;
  fetchedAt: string;
  fallbackUsed: boolean;
  message?: string;
};

export type SourceResponse<TItem> = {
  items: TItem[];
  source: SourceMetadata;
};

export type SourceQuery = {
  sport: SourceSport;
  year?: number;
  week?: number;
  team?: string;
  conference?: string;
  seasonType?: string;
  classification?: string;
  date?: string;
};

export type ScoreSourceItem = {
  id: string;
  sport: SourceSport;
  status: string;
  startTime: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  week?: number;
  season?: number;
};

export type MatchupSourceItem = {
  id: string;
  sport: SourceSport;
  status: string;
  startTime: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  week?: number;
  season?: number;
  venue?: string;
};

export type StandingSourceItem = {
  id: string;
  sport: SourceSport;
  team: string;
  rank: number | null;
  wins: number | null;
  losses: number | null;
  pointsFor: number | null;
  pointsAgainst: number | null;
  conference?: string | null;
  season?: number | null;
};
