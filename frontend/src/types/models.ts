/**
 * Shared TypeScript shapes for UI and API contract.
 * Keep in sync with services/api/nextplayApi.ts and services/mocks/mockNextPlayApi.ts.
 */
export type LeagueId = string
export type UserId = string
export type TeamId = string
export type PlayerId = string
export type MessageId = string

export const Sport = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  BASEBALL: 'baseball',
} as const
export type Sport = (typeof Sport)[keyof typeof Sport]

export const LeagueState = {
  CREATED: 'CREATED',
  DRAFT_SCHEDULED: 'DRAFT_SCHEDULED',
  DRAFT_IN_PROGRESS: 'DRAFT_IN_PROGRESS',
  SEASON_ACTIVE: 'SEASON_ACTIVE',
  PLAYOFFS: 'PLAYOFFS',
  COMPLETE: 'COMPLETE',
} as const
export type LeagueState = (typeof LeagueState)[keyof typeof LeagueState]

export const LeagueRole = {
  MEMBER: 'MEMBER',
  COMMISSIONER: 'COMMISSIONER',
} as const
export type LeagueRole = (typeof LeagueRole)[keyof typeof LeagueRole]

export type LeagueMember = {
  userId: UserId
  role: LeagueRole
  displayName: string
}

/** League home roster row: team + record when season data exists (from standings). */
export type LeagueMemberSpotlight = {
  userId: UserId
  displayName: string
  role: LeagueRole
  teamName: string | null
  wins: number | null
  losses: number | null
  rank: number | null
}

export type League = {
  id: LeagueId
  name: string
  sport: Sport
  state: LeagueState
  inviteCode: string
  members: LeagueMember[]
  /**
   * The current user's role in this league.
   * (Computed by the mock API based on the authenticated user.)
   */
  role: LeagueRole
}

export const PlayerStatus = {
  ACTIVE: 'ACTIVE',
  INJURED: 'INJURED',
  OUT: 'OUT',
} as const
export type PlayerStatus = (typeof PlayerStatus)[keyof typeof PlayerStatus]

export type ScoringLine = {
  /** e.g. Pass TD, Passing yards */
  label: string
  /**
   * Raw stat volume: # of TDs, catches, yards, etc.
   * (Final product: from box score / stat feed.)
   */
  quantity: number
  /**
   * Fantasy points per scoring unit when `yardsDivisor` is unset: `points = quantity × pointsPerUnit`.
   * When `yardsDivisor` is set: `points = (quantity ÷ yardsDivisor) × pointsPerUnit`.
   */
  pointsPerUnit: number
  /** Set for yard-based lines; quantity is yards. */
  yardsDivisor?: number
  points: number
}

/** Per-player fantasy points from stat lines (final product: week-locked actuals vs projection). */
export type PlayerScoringBreakdown = {
  fantasyTotal: number
  isProjected: boolean
  lines: ScoringLine[]
}

export type StarterWeekScoring = {
  playerId: PlayerId
  playerName: string
  position: string
  breakdown: PlayerScoringBreakdown
}

/** Roster rollup for one matchup week — starters count toward H2H score; bench shown for context. */
export type TeamWeekScoring = {
  week: number
  starterTotal: number
  benchTotal: number
  starters: StarterWeekScoring[]
  bench: StarterWeekScoring[]
}

export type Player = {
  id: PlayerId
  name: string
  position: string
  team: string
  status: PlayerStatus
  drafted: boolean
  projectedPoints: number
  /** Present on player detail fetches; list endpoints omit for payload size. */
  scoringBreakdown?: PlayerScoringBreakdown
}

export type DraftPick = {
  overallPick: number
  round: number
  pickInRound: number
  teamId: TeamId
  playerId: PlayerId
  teamName: string
  playerName: string
  pickedByUserId: UserId
  isAuto: boolean
  pickedAt: string // ISO timestamp
}

export type DraftState = {
  leagueId: LeagueId
  status:
    | (typeof LeagueState)['DRAFT_SCHEDULED']
    | (typeof LeagueState)['DRAFT_IN_PROGRESS']
    | (typeof LeagueState)['COMPLETE']
  draftType: 'snake' | 'auto'

  currentOverallPick: number
  currentRound: number
  currentPickInRound: number
  currentTeamId: TeamId
  currentTeamName: string
  autoDraftTeamIds: TeamId[]

  timerEndsAt: string // ISO timestamp
  picks: DraftPick[]

  /**
   * Turn info for the current user.
   * - If false, the UI should disable “Pick”.
   */
  isCurrentUserTurn: boolean
}

export type FantasyTeam = {
  id: TeamId
  name: string
  ownerUserId: UserId
  rosterPlayerIds: PlayerId[]
  lineup: {
    // MVP uses simple slots; later can map to football/basketball positions.
    starters: PlayerId[]
    bench: PlayerId[]
  }
  lineupLockAt: string // ISO timestamp
}

export type TeamState = {
  leagueId: LeagueId
  team: FantasyTeam
  isLineupLocked: boolean
  rosterCap: number
  /** When present, mock shows how this week’s lineup adds up (starters vs bench). */
  weekScoring?: TeamWeekScoring
}

export type MatchupStatus = 'UPCOMING' | 'LIVE' | 'FINAL'

export type Matchup = {
  id: string
  week: number
  homeTeamId: TeamId
  awayTeamId: TeamId
  homeTeamName: string
  awayTeamName: string
  status: MatchupStatus
  homeScore?: number
  awayScore?: number
  /** Lineup projection (fantasy pts) — shown before/during live week for demos */
  homeProjected?: number
  awayProjected?: number
}

/** One side of a matchup: starter rollups + per-player stat lines (Team page parity). */
export type MatchupSideLineupScoring = {
  teamId: TeamId
  teamName: string
  starterTotal: number
  starters: StarterWeekScoring[]
}

export type MatchupLineupScoring = {
  matchupId: string
  week: number
  status: MatchupStatus
  home: MatchupSideLineupScoring
  away: MatchupSideLineupScoring
}

export type StandingRow = {
  teamId: TeamId
  teamName: string
  rank: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
}

export type ChatMessage = {
  id: MessageId
  leagueId: LeagueId
  userId: UserId
  displayName: string
  text: string
  createdAt: string // ISO timestamp
}

