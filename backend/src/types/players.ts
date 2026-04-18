export type SupportedSport = "football" | "basketball" | "baseball";

export type PlayerStatus = "ACTIVE" | "INJURED" | "OUT";

export type PlayerQuery = {
  sport: SupportedSport;
  search?: string;
  position?: string;
  team?: string;
  status?: PlayerStatus;
  drafted?: "any" | "available" | "drafted";
  sort?: "projectedPoints_desc" | "name_asc";
  year?: number;
};

export type ScoringLine = {
  label: string;
  quantity: number;
  pointsPerUnit: number;
  yardsDivisor?: number;
  points: number;
};

export type PlayerScoringBreakdown = {
  fantasyTotal: number;
  isProjected: boolean;
  lines: ScoringLine[];
};

export type Player = {
  id: string;
  name: string;
  position: string;
  team: string;
  status: PlayerStatus;
  drafted: boolean;
  projectedPoints: number;
  scoringBreakdown?: PlayerScoringBreakdown;
};
