/**
 * In-browser mock for every export of services/api/nextplayApi.ts.
 * Swap the re-export in nextplayApi.ts when the real backend is ready.
 */
import type {
  ChatMessage,
  DraftPick,
  DraftState,
  FantasyTeam,
  League,
  LeagueId,
  LeagueMember,
  LeagueMemberSpotlight,
  LeagueState,
  Player,
  PlayerId,
  PlayerScoringBreakdown,
  PlayerStatus,
  ScoringLine,
  Sport,
  StarterWeekScoring,
  TeamId,
  TeamState,
  TeamWeekScoring,
  Matchup,
  MatchupLineupScoring,
  StandingRow,
  UserId,
} from '@/types/models'
import {
  LeagueState as LeagueStateValues,
  LeagueRole as LeagueRoleValues,
  PlayerStatus as PlayerStatusValues,
} from '@/types/models'

import { isAfter, addSeconds } from 'date-fns'
import { NEXTPLAY_DEV_MODE_STORAGE_KEY } from '@/providers/DevModeProvider'

const random = Math.random

type DraftStateBase = Omit<DraftState, 'isCurrentUserTurn'>

export type LeagueSettings = {
  leagueId: LeagueId
  leagueName: string
  sport: Sport
  inviteCode: string
  isPrivate: boolean
  teamCount: number
  maxTeams: number
  rosterCap: number
  lineupStarters: number
  draftType: 'snake' | 'auto'
  draftPickSeconds: number
  autoPickEnabled: boolean
  draftRounds: number
  scoringPreset: 'standard' | 'ppr'
  pointsPassTd: number
  pointsRushTd: number
  pointsRecTd: number
  pointsReception: number
  addDropEnabled: boolean
  tradeApproval: 'commissioner' | 'none'
}

export type UpdateLeagueSettingsInput = {
  leagueName?: string
  isPrivate?: boolean
  draftType?: 'snake' | 'auto'
  draftPickSeconds?: number
  autoPickEnabled?: boolean
  draftRounds?: number
  scoringPreset?: 'standard' | 'ppr'
  pointsPassTd?: number
  pointsRushTd?: number
  pointsRecTd?: number
  pointsReception?: number
  addDropEnabled?: boolean
  tradeApproval?: 'commissioner' | 'none'
}

export type PlayoffMatch = {
  id: string
  round: 'Semifinal' | 'Final'
  seedA: number
  seedB: number
  teamA: string
  teamB: string
  scoreA: number | null
  scoreB: number | null
  winner: string | null
}

export type PlayerInsight = {
  playerId: PlayerId
  confidence: 'High' | 'Medium' | 'Low'
  trend: 'up' | 'down'
  volatility: number
}

export type MatchupInsight = {
  matchupId: string
  homeWinProbability: number
  awayWinProbability: number
  projectedTotal: number
  confidence: 'High' | 'Medium' | 'Low'
}

export type LeagueAuditEvent = {
  id: string
  leagueId: LeagueId
  type:
    | 'LEAGUE_CREATED'
    | 'SETTINGS_UPDATED'
    | 'INVITE_REGENERATED'
    | 'MEMBER_ROLE_CHANGED'
    | 'MEMBER_REMOVED'
    | 'STATE_CHANGED'
    | 'AUTO_PICK'
    | 'MANUAL_PICK'
    | 'ADD_DROP'
  actorDisplayName: string
  message: string
  createdAt: string
}

type LeagueRecord = {
  league: Omit<League, 'role' | 'members'>
  members: LeagueMember[]
  teams: FantasyTeam[]
  players: Player[]
  autoDraftTeamIds: TeamId[]
  settings: Omit<LeagueSettings, 'leagueId' | 'leagueName' | 'sport' | 'inviteCode' | 'teamCount'>
  draftBase: DraftStateBase
  matchupsByWeek: Record<number, Matchup[]>
  standings: StandingRow[]
  chatMessages: ChatMessage[]
  matchupMessagesById: Record<string, ChatMessage[]>
  auditEvents: LeagueAuditEvent[]
}

type MockDb = {
  leaguesById: Record<LeagueId, LeagueRecord>
  nextLeagueCounter: number
}

export type TickerItem = {
  id: string
  label: string
}

const STORAGE_KEY = 'nextplay.mock.db.v3'

function safeNowIso(): string {
  return new Date().toISOString()
}

function getMemberDisplayName(rec: LeagueRecord, userId: UserId) {
  return rec.members.find((m) => m.userId === userId)?.displayName ?? 'System'
}

function pushAuditEvent(
  rec: LeagueRecord,
  type: LeagueAuditEvent['type'],
  message: string,
  actorDisplayName: string,
) {
  rec.auditEvents.push({
    id: makeId('audit', `${rec.league.id}_${Date.now()}_${type}_${message.slice(0, 14)}`),
    leagueId: rec.league.id,
    type,
    actorDisplayName,
    message,
    createdAt: safeNowIso(),
  })
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function maybeThrowError() {
  // Only force errors when explicitly enabled (prevents flaky demos).
  try {
    const force = localStorage.getItem('nextplay.mock.forceError')
    if (force === '1') throw new Error('Mock network error')
  } catch {
    // Ignore storage issues.
  }
}

function hashStringToNumber(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function makeId(prefix: string, idSource: string) {
  return `${prefix}_${hashStringToNumber(idSource).toString(16)}`
}

function computeRoundAndPickInRound(overallPick: number, roundSize: number) {
  // overallPick is 1-based
  const zeroIdx = overallPick - 1
  const round = Math.floor(zeroIdx / roundSize) + 1
  const pickInRound = (zeroIdx % roundSize) + 1
  return { round, pickInRound }
}

function buildSnakeDraftOrder(teamIds: TeamId[], totalPicks: number): TeamId[] {
  const n = teamIds.length
  const order: TeamId[] = []

  for (let overall = 1; overall <= totalPicks; overall++) {
    const { round, pickInRound } = computeRoundAndPickInRound(overall, n)
    const isEvenRound = round % 2 === 0
    const idx = isEvenRound ? n - pickInRound : pickInRound - 1
    order.push(teamIds[idx])
  }

  return order
}

function seedPlayers(sport: Sport, totalPlayers: number): Player[] {
  const positionsBySport: Record<Sport, string[]> = {
    football: ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'],
    basketball: ['G', 'PG', 'SG', 'SF', 'PF', 'C'],
    baseball: ['SP', 'RP', 'C', '1B', '2B', 'SS', '3B', 'OF'],
  }
  const schoolsBySport: Record<Sport, string[]> = {
    football: ['Alabama', 'Georgia', 'Texas', 'Michigan', 'Notre Dame', 'LSU', 'Oregon', 'Tennessee'],
    basketball: ['Duke', 'Kansas', 'UConn', 'UNC', 'Kentucky', 'UCLA', 'Gonzaga', 'Purdue'],
    baseball: ['Vanderbilt', 'LSU', 'Florida', 'Arkansas', 'Texas A&M', 'Wake Forest', 'Stanford', 'TCU'],
  }
  const firstNames = [
    'Mason',
    'Jalen',
    'Ethan',
    'Noah',
    'Xavier',
    'Braylon',
    'Elijah',
    'Kai',
    'Jordan',
    'Cameron',
    'Malik',
    'Tyler',
    'Drew',
    'Avery',
    'Roman',
    'Caleb',
  ]
  const lastNames = [
    'Mitchell',
    'Carter',
    'Reynolds',
    'Simmons',
    'Brooks',
    'Washington',
    'Foster',
    'Turner',
    'Hayes',
    'Coleman',
    'Price',
    'Parker',
    'Daniels',
    'Morris',
    'Young',
    'Collins',
  ]
  const positions = positionsBySport[sport]
  const teams = schoolsBySport[sport]
  const statuses: PlayerStatus[] = [
    PlayerStatusValues.ACTIVE,
    PlayerStatusValues.ACTIVE,
    PlayerStatusValues.ACTIVE,
    PlayerStatusValues.INJURED,
    PlayerStatusValues.OUT,
  ]

  const players: Player[] = []
  for (let i = 0; i < totalPlayers; i++) {
    const position = positions[i % positions.length]
    const team = teams[i % teams.length]
    const status = statuses[(i * 7) % statuses.length]

    const id = makeId('player', `${position}_${team}_${i}`)
    players.push({
      id,
      name: `${firstNames[i % firstNames.length]} ${lastNames[(i * 5) % lastNames.length]}`,
      position,
      team,
      status,
      drafted: false,
      projectedPoints: 8 + ((i * 19) % 42) + (sport === 'football' ? 8 : sport === 'basketball' ? 11 : 6),
    })
  }
  return players
}

function seedTeams(teamOwners: Array<{ teamName: string; ownerUserId: UserId }>): FantasyTeam[] {
  const now = new Date()

  return teamOwners.map((t, idx) => {
    const id = makeId('team', t.teamName + t.ownerUserId)
    const rosterPlayerIds: PlayerId[] = []
    const starters: PlayerId[] = []
    const bench: PlayerId[] = []

    return {
      id,
      name: t.teamName,
      ownerUserId: t.ownerUserId,
      rosterPlayerIds,
      lineup: { starters, bench },
      lineupLockAt: addSeconds(now, 3600 * (idx + 1)).toISOString(),
    }
  })
}

function seedChat(leagueId: LeagueId, members: LeagueMember[]): ChatMessage[] {
  const base = new Date()
  return [
    {
      id: makeId('msg', `${leagueId}_1`),
      leagueId,
      userId: members[0]?.userId ?? 'user_1',
      displayName: members[0]?.displayName ?? 'Player',
      text: 'Welcome to NextPlay!',
      createdAt: addSeconds(base, -3600 * 3).toISOString(),
    },
    {
      id: makeId('msg', `${leagueId}_2`),
      leagueId,
      userId: members[1]?.userId ?? 'user_2',
      displayName: members[1]?.displayName ?? 'Teammate',
      text: 'Draft is getting close—good luck!',
      createdAt: addSeconds(base, -3600 * 1).toISOString(),
    },
  ]
}

function seedMatchupMessages(
  leagueId: LeagueId,
  members: LeagueMember[],
  matchupsByWeek: Record<number, Matchup[]>,
): Record<string, ChatMessage[]> {
  const allMatchups = Object.values(matchupsByWeek).flat()
  return Object.fromEntries(
    allMatchups.map((m, idx) => [
      m.id,
      [
        {
          id: makeId('mmsg', `${m.id}_1`),
          leagueId,
          userId: members[idx % Math.max(members.length, 1)]?.userId ?? 'user_1',
          displayName: members[idx % Math.max(members.length, 1)]?.displayName ?? 'Member',
          text: 'Good luck this week.',
          createdAt: addSeconds(new Date(), -3600 * (idx + 1)).toISOString(),
        },
      ],
    ]),
  )
}

function buildInitialDb(): MockDb {
  const now = new Date()

  const userMember: UserId = 'user_1'
  const userOtherA: UserId = 'user_2'
  const userOtherB: UserId = 'user_3'
  const userOtherC: UserId = 'user_4'
  const userOtherD: UserId = 'user_5'
  const userOtherE: UserId = 'user_6'
  const userOtherF: UserId = 'user_7'
  const userOtherG: UserId = 'user_8'

  const league1Id: LeagueId = '1'
  const league2Id: LeagueId = '2'
  const league3Id: LeagueId = '3'

  const league1Members: LeagueMember[] = [
    { userId: userMember, role: LeagueRoleValues.COMMISSIONER, displayName: 'Kaden' },
    { userId: userOtherA, role: LeagueRoleValues.MEMBER, displayName: 'Hudson' },
    { userId: userOtherB, role: LeagueRoleValues.MEMBER, displayName: 'Ahmad' },
    { userId: userOtherC, role: LeagueRoleValues.MEMBER, displayName: 'Fardeen' },
    { userId: userOtherD, role: LeagueRoleValues.MEMBER, displayName: 'Maya' },
    { userId: userOtherE, role: LeagueRoleValues.MEMBER, displayName: 'Khalil' },
  ]

  const league2Members: LeagueMember[] = [
    { userId: userMember, role: LeagueRoleValues.MEMBER, displayName: 'Kaden' },
    { userId: userOtherA, role: LeagueRoleValues.COMMISSIONER, displayName: 'Hudson' },
    { userId: userOtherB, role: LeagueRoleValues.MEMBER, displayName: 'Ahmad' },
    { userId: userOtherC, role: LeagueRoleValues.MEMBER, displayName: 'Fardeen' },
    { userId: userOtherD, role: LeagueRoleValues.MEMBER, displayName: 'Maya' },
    { userId: userOtherE, role: LeagueRoleValues.MEMBER, displayName: 'Khalil' },
    { userId: userOtherF, role: LeagueRoleValues.MEMBER, displayName: 'Jace' },
    { userId: userOtherG, role: LeagueRoleValues.MEMBER, displayName: 'Riley' },
  ]

  const league3Members: LeagueMember[] = [
    { userId: userMember, role: LeagueRoleValues.MEMBER, displayName: 'Kaden' },
    { userId: userOtherA, role: LeagueRoleValues.COMMISSIONER, displayName: 'Hudson' },
    { userId: userOtherB, role: LeagueRoleValues.MEMBER, displayName: 'Ahmad' },
    { userId: userOtherC, role: LeagueRoleValues.MEMBER, displayName: 'Fardeen' },
    { userId: userOtherD, role: LeagueRoleValues.MEMBER, displayName: 'Maya' },
    { userId: userOtherE, role: LeagueRoleValues.MEMBER, displayName: 'Khalil' },
  ]

  const league1Teams = seedTeams([
    { teamName: 'Route Runners', ownerUserId: userMember },
    { teamName: 'Iron Valley', ownerUserId: userOtherA },
    { teamName: 'Fourth & Gold', ownerUserId: userOtherB },
    { teamName: 'Northside Blitz', ownerUserId: userOtherC },
    { teamName: 'Red Zone Unit', ownerUserId: userOtherD },
    { teamName: 'Gridline Kings', ownerUserId: userOtherE },
  ])

  const league2Teams = seedTeams([
    { teamName: 'Paint Pressure', ownerUserId: userMember },
    { teamName: 'Full Court Flux', ownerUserId: userOtherA },
    { teamName: 'Blue Arc', ownerUserId: userOtherB },
    { teamName: 'Glass Cutters', ownerUserId: userOtherC },
    { teamName: 'Tempo North', ownerUserId: userOtherD },
    { teamName: 'Rim Theory', ownerUserId: userOtherE },
    { teamName: 'Motion Unit', ownerUserId: userOtherF },
    { teamName: 'Baseline Eight', ownerUserId: userOtherG },
  ])

  const league3Teams = seedTeams([
    { teamName: 'Diamond Shift', ownerUserId: userMember },
    { teamName: 'Bullpen Labs', ownerUserId: userOtherA },
    { teamName: 'Left Field Noise', ownerUserId: userOtherB },
    { teamName: 'Line Drive Club', ownerUserId: userOtherC },
    { teamName: 'Southpaw Signals', ownerUserId: userOtherD },
    { teamName: 'Night Game Nine', ownerUserId: userOtherE },
  ])

  const basePlayers1 = seedPlayers('football', 84)
  const basePlayers2 = seedPlayers('basketball', 96)
  const basePlayers3 = seedPlayers('baseball', 90)

  // League 2: Draft in progress (some picks already made)
  const draftOrder2 = buildSnakeDraftOrder(league2Teams.map((t) => t.id), 32)

  const draft2Picks: DraftPick[] = []
  for (let i = 1; i <= 5; i++) {
    const teamId = draftOrder2[i - 1]
    const team = league2Teams.find((t) => t.id === teamId)!
    const player = basePlayers2[i - 1]
    player.drafted = true
    team.rosterPlayerIds.push(player.id)
    if (team.rosterPlayerIds.length <= 4) {
      team.lineup.starters.push(player.id)
    } else {
      team.lineup.bench.push(player.id)
    }

    const { round, pickInRound } = computeRoundAndPickInRound(i, league2Teams.length)
    draft2Picks.push({
      overallPick: i,
      round,
      pickInRound,
      teamId,
      playerId: player.id,
      teamName: team.name,
      playerName: player.name,
      pickedByUserId: team.ownerUserId,
      isAuto: false,
      pickedAt: addSeconds(now, -3600 * (6 - i)).toISOString(),
    })
  }

  const league1DraftBase: DraftStateBase = {
    leagueId: league1Id,
    status: LeagueStateValues.DRAFT_SCHEDULED,
    draftType: 'snake',
    currentOverallPick: 1,
    currentRound: 1,
    currentPickInRound: 1,
    currentTeamId: league1Teams[0]!.id,
    currentTeamName: league1Teams[0]!.name,
    autoDraftTeamIds: [],
    timerEndsAt: addSeconds(now, 1800).toISOString(),
    picks: [],
  }

  // League 3: Season active (draft complete, rosters locked/unlocked based on lineupLockAt)
  const draftOrder3 = buildSnakeDraftOrder(league3Teams.map((t) => t.id), 24)
  const draft3Picks: DraftPick[] = []
  for (let i = 1; i <= 24; i++) {
    const teamId = draftOrder3[i - 1]
    const team = league3Teams.find((t) => t.id === teamId)!
    const player = basePlayers3[i - 1]
    player.drafted = true
    team.rosterPlayerIds.push(player.id)
    if (team.rosterPlayerIds.length <= 4) {
      team.lineup.starters.push(player.id)
    } else {
      team.lineup.bench.push(player.id)
    }

    const { round, pickInRound } = computeRoundAndPickInRound(i, league3Teams.length)
    draft3Picks.push({
      overallPick: i,
      round,
      pickInRound,
      teamId,
      playerId: player.id,
      teamName: team.name,
      playerName: player.name,
      pickedByUserId: team.ownerUserId,
      isAuto: false,
      pickedAt: addSeconds(now, -3600 * (18 - i)).toISOString(),
    })
  }

  const league2DraftBase: DraftStateBase = {
    leagueId: league2Id,
    status: LeagueStateValues.DRAFT_IN_PROGRESS,
    draftType: 'snake',
    currentOverallPick: 6,
    currentRound: 1,
    currentPickInRound: 6,
    currentTeamId: draftOrder2[5]!,
    currentTeamName: league2Teams.find((t) => t.id === draftOrder2[5])?.name ?? 'Unknown Team',
    autoDraftTeamIds: [],
    timerEndsAt: addSeconds(now, 40).toISOString(),
    picks: draft2Picks,
  }

  const league3DraftBase: DraftStateBase = {
    leagueId: league3Id,
    status: LeagueStateValues.COMPLETE,
    draftType: 'snake',
    currentOverallPick: 25,
    currentRound: 5,
    currentPickInRound: 1,
    currentTeamId: draftOrder3[0]!,
    currentTeamName: league3Teams[0]!.name,
    autoDraftTeamIds: [],
    timerEndsAt: addSeconds(now, -10).toISOString(),
    picks: draft3Picks,
  }

  const matchupsByWeek: Record<number, Matchup[]> = {
    1: [
      {
        id: makeId('m', `${league3Id}_w1_${league3Teams[0]!.id}_${league3Teams[1]!.id}`),
        week: 1,
        homeTeamId: league3Teams[0]!.id,
        homeTeamName: league3Teams[0]!.name,
        awayTeamId: league3Teams[1]!.id,
        awayTeamName: league3Teams[1]!.name,
        status: 'FINAL',
        homeScore: 84,
        awayScore: 71,
      },
      {
        id: makeId('m', `${league3Id}_w1_${league3Teams[2]!.id}_${league3Teams[3]!.id}`),
        week: 1,
        homeTeamId: league3Teams[2]!.id,
        homeTeamName: league3Teams[2]!.name,
        awayTeamId: league3Teams[3]!.id,
        awayTeamName: league3Teams[3]!.name,
        status: 'FINAL',
        homeScore: 66,
        awayScore: 79,
      },
    ],
    2: [
      {
        id: makeId('m', `${league3Id}_w2_${league3Teams[0]!.id}_${league3Teams[1]!.id}`),
        week: 2,
        homeTeamId: league3Teams[0]!.id,
        homeTeamName: league3Teams[0]!.name,
        awayTeamId: league3Teams[1]!.id,
        awayTeamName: league3Teams[1]!.name,
        status: 'FINAL',
        homeScore: 91,
        awayScore: 88,
      },
    ],
  }

  const standings: StandingRow[] = [
    {
      teamId: league3Teams[0]!.id,
      teamName: league3Teams[0]!.name,
      rank: 1,
      wins: 2,
      losses: 0,
      pointsFor: 175,
      pointsAgainst: 142,
    },
    {
      teamId: league3Teams[3]!.id,
      teamName: league3Teams[3]!.name,
      rank: 2,
      wins: 1,
      losses: 1,
      pointsFor: 154,
      pointsAgainst: 161,
    },
    {
      teamId: league3Teams[2]!.id,
      teamName: league3Teams[2]!.name,
      rank: 3,
      wins: 1,
      losses: 1,
      pointsFor: 132,
      pointsAgainst: 145,
    },
    {
      teamId: league3Teams[1]!.id,
      teamName: league3Teams[1]!.name,
      rank: 4,
      wins: 0,
      losses: 2,
      pointsFor: 159,
      pointsAgainst: 172,
    },
  ]

  const league1: LeagueRecord = {
    league: {
      id: league1Id,
      name: 'Saturday Lights: East Division',
      sport: 'football',
      state: LeagueStateValues.CREATED,
      inviteCode: 'PLAY123',
    },
    members: league1Members,
    teams: league1Teams,
    players: basePlayers1.slice(),
    autoDraftTeamIds: [],
    settings: {
      isPrivate: true,
      maxTeams: league1Teams.length,
      rosterCap: 10,
      lineupStarters: 4,
      draftType: 'snake',
      draftPickSeconds: 45,
      autoPickEnabled: false,
      draftRounds: 6,
      scoringPreset: 'standard',
      pointsPassTd: 4,
      pointsRushTd: 6,
      pointsRecTd: 6,
      pointsReception: 0,
      addDropEnabled: true,
      tradeApproval: 'commissioner',
    },
    draftBase: league1DraftBase,
    matchupsByWeek: {},
    standings: [],
    chatMessages: seedChat(league1Id, league1Members),
    matchupMessagesById: {},
    auditEvents: [
      {
        id: makeId('audit', `${league1Id}_seed_created`),
        leagueId: league1Id,
        type: 'LEAGUE_CREATED',
        actorDisplayName: 'Kaden',
        message: 'League created by commissioner.',
        createdAt: safeNowIso(),
      },
    ],
  }

  const league2: LeagueRecord = {
    league: {
      id: league2Id,
      name: 'Hardwood Pulse League',
      sport: 'basketball',
      state: LeagueStateValues.DRAFT_IN_PROGRESS,
      inviteCode: 'SEASON456',
    },
    members: league2Members,
    teams: league2Teams,
    players: basePlayers2.slice(),
    autoDraftTeamIds: [league2Teams[6]!.id],
    settings: {
      isPrivate: true,
      maxTeams: league2Teams.length,
      rosterCap: 10,
      lineupStarters: 4,
      draftType: 'snake',
      draftPickSeconds: 45,
      autoPickEnabled: true,
      draftRounds: 6,
      scoringPreset: 'standard',
      pointsPassTd: 4,
      pointsRushTd: 6,
      pointsRecTd: 6,
      pointsReception: 0,
      addDropEnabled: true,
      tradeApproval: 'commissioner',
    },
    draftBase: league2DraftBase,
    matchupsByWeek: {},
    standings: [],
    chatMessages: seedChat(league2Id, league2Members),
    matchupMessagesById: {},
    auditEvents: [
      {
        id: makeId('audit', `${league2Id}_seed_created`),
        leagueId: league2Id,
        type: 'LEAGUE_CREATED',
        actorDisplayName: 'Hudson',
        message: 'League created by commissioner.',
        createdAt: safeNowIso(),
      },
    ],
  }

  const league3: LeagueRecord = {
    league: {
      id: league3Id,
      name: 'Diamond Series Collective',
      sport: 'baseball',
      state: LeagueStateValues.SEASON_ACTIVE,
      inviteCode: 'CLUB789',
    },
    members: league3Members,
    teams: league3Teams,
    players: basePlayers3.slice(),
    autoDraftTeamIds: [],
    settings: {
      isPrivate: true,
      maxTeams: league3Teams.length,
      rosterCap: 10,
      lineupStarters: 4,
      draftType: 'snake',
      draftPickSeconds: 45,
      autoPickEnabled: false,
      draftRounds: 6,
      scoringPreset: 'standard',
      pointsPassTd: 4,
      pointsRushTd: 6,
      pointsRecTd: 6,
      pointsReception: 0,
      addDropEnabled: true,
      tradeApproval: 'commissioner',
    },
    draftBase: league3DraftBase,
    matchupsByWeek,
    standings,
    chatMessages: seedChat(league3Id, league3Members),
    matchupMessagesById: seedMatchupMessages(league3Id, league3Members, matchupsByWeek),
    auditEvents: [
      {
        id: makeId('audit', `${league3Id}_seed_created`),
        leagueId: league3Id,
        type: 'LEAGUE_CREATED',
        actorDisplayName: 'Hudson',
        message: 'League created by commissioner.',
        createdAt: safeNowIso(),
      },
    ],
  }

  return {
    leaguesById: {
      [league1Id]: league1,
      [league2Id]: league2,
      [league3Id]: league3,
    },
    nextLeagueCounter: 4,
  }
}

function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return buildInitialDb()
    const parsed = JSON.parse(raw) as MockDb
    if (!parsed?.leaguesById) return buildInitialDb()
    // Lightweight forward-compat migration for older localStorage snapshots.
    for (const rec of Object.values(parsed.leaguesById)) {
      if (!Array.isArray(rec.autoDraftTeamIds)) rec.autoDraftTeamIds = []
      if (!Array.isArray(rec.auditEvents)) rec.auditEvents = []
      if (!rec.settings.draftRounds) rec.settings.draftRounds = 6
      if (!rec.settings.scoringPreset) rec.settings.scoringPreset = 'standard'
      if (typeof rec.settings.pointsPassTd !== 'number') rec.settings.pointsPassTd = 4
      if (typeof rec.settings.pointsRushTd !== 'number') rec.settings.pointsRushTd = 6
      if (typeof rec.settings.pointsRecTd !== 'number') rec.settings.pointsRecTd = 6
      if (typeof rec.settings.pointsReception !== 'number') rec.settings.pointsReception = 0
      if (typeof rec.settings.addDropEnabled !== 'boolean') rec.settings.addDropEnabled = true
      if (!rec.settings.tradeApproval) rec.settings.tradeApproval = 'commissioner'
    }
    return parsed
  } catch {
    return buildInitialDb()
  }
}

function persistDb(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

const db = loadDb()

export async function listMyLeagues(userId: UserId): Promise<League[]> {
  await delay(350)
  maybeThrowError()

  const leagues = Object.values(db.leaguesById)
  return leagues
    .map((rec) => {
      const member = rec.members.find((m) => m.userId === userId)
      if (!member) return null
      return {
        ...rec.league,
        members: rec.members,
        role: member.role,
      } satisfies League
    })
    .filter(Boolean) as League[]
}

export async function getLeagueById(
  leagueId: LeagueId,
  userId: UserId,
): Promise<League> {
  await delay(250)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  return {
    ...rec.league,
    members: rec.members,
    role: member.role,
  }
}

export async function getLeagueMemberSpotlight(
  leagueId: LeagueId,
  userId: UserId,
): Promise<LeagueMemberSpotlight[]> {
  await delay(180)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const gate = rec.members.find((m) => m.userId === userId)
  if (!gate) throw new Error('Not authorized')

  const standingByTeam = new Map(rec.standings.map((s) => [s.teamId, s]))

  return rec.members.map((m) => {
    const team = rec.teams.find((t) => t.ownerUserId === m.userId) ?? null
    const st = team ? standingByTeam.get(team.id) : undefined
    return {
      userId: m.userId,
      displayName: m.displayName,
      role: m.role,
      teamName: team?.name ?? null,
      wins: st !== undefined ? st.wins : null,
      losses: st !== undefined ? st.losses : null,
      rank: st !== undefined ? st.rank : null,
    }
  })
}

export type CreateLeagueInput = {
  name: string
  sport: 'football' | 'basketball' | 'baseball'
  teamCount: number
  inviteCode?: string
}

export async function createLeague(input: CreateLeagueInput, userId: UserId): Promise<League> {
  await delay(450)
  maybeThrowError()

  const id = String(db.nextLeagueCounter++)
  const inviteCode = input.inviteCode?.trim() || `INV${id}${Math.floor(random() * 100)}`

  const leagueBase = {
    id,
    name:
      input.name.trim() ||
      `${input.sport[0].toUpperCase()}${input.sport.slice(1)} Fantasy League ${id}`,
    sport: input.sport,
    state: LeagueStateValues.CREATED,
    inviteCode,
  }

  const commissionerMember: LeagueMember = {
    userId,
    role: LeagueRoleValues.COMMISSIONER,
    displayName: 'League Owner',
  }

  // Handoff note: this remains intentionally deterministic so frontend demos are repeatable.
  // Backend integration should replace this seed block with server-provided league/team/player data.
  const teamCount = Math.max(2, Math.min(10, input.teamCount))
  const mascots = [
    'Falcons',
    'Eagles',
    'Bulldogs',
    'Cougars',
    'Knights',
    'Panthers',
    'Tigers',
    'Ravens',
    'Wildcats',
    'Bears',
  ]
  const teamOwners: Array<{ teamName: string; ownerUserId: UserId }> = Array.from(
    { length: teamCount },
    (_, idx) => ({
      teamName: mascots[idx % mascots.length],
      ownerUserId: idx === 0 ? userId : `user_${10 + idx}`,
    }),
  )

  const teams = seedTeams(teamOwners)
  const players = seedPlayers(input.sport, Math.max(teamCount * 12, 72)).map((p, idx) => ({
    ...p,
    drafted: false,
    projectedPoints: 8 + ((idx * 23) % 70),
  }))

  const draftOrder = buildSnakeDraftOrder(teams.map((t) => t.id), teamCount * 2)
  const timerEndsAt = addSeconds(new Date(), 30).toISOString()

  const draftBase: DraftStateBase = {
    leagueId: id,
    status: LeagueStateValues.DRAFT_SCHEDULED,
    draftType: 'snake',
    currentOverallPick: 1,
    currentRound: 1,
    currentPickInRound: 1,
    currentTeamId: draftOrder[0]!,
    currentTeamName: teams[0]?.name ?? 'Team 1',
    autoDraftTeamIds: [],
    timerEndsAt,
    picks: [],
  }

  db.leaguesById[id] = {
    league: leagueBase,
    members: [commissionerMember],
    teams,
    players,
    autoDraftTeamIds: [],
    settings: {
      isPrivate: true,
      maxTeams: teamCount,
      rosterCap: 10,
      lineupStarters: 4,
      draftType: 'snake',
      draftPickSeconds: 45,
      autoPickEnabled: false,
      draftRounds: 6,
      scoringPreset: 'standard',
      pointsPassTd: 4,
      pointsRushTd: 6,
      pointsRecTd: 6,
      pointsReception: 0,
      addDropEnabled: true,
      tradeApproval: 'commissioner',
    },
    draftBase,
    matchupsByWeek: {},
    standings: [],
    chatMessages: [],
    matchupMessagesById: {},
    auditEvents: [
      {
        id: makeId('audit', `${id}_created`),
        leagueId: id,
        type: 'LEAGUE_CREATED',
        actorDisplayName: commissionerMember.displayName,
        message: 'League created by commissioner.',
        createdAt: safeNowIso(),
      },
    ],
  }

  persistDb(db)

  return {
    ...leagueBase,
    members: [commissionerMember],
    role: LeagueRoleValues.COMMISSIONER,
  }
}

export async function joinLeagueByInviteCode(
  inviteCode: string,
  userId: UserId,
): Promise<League> {
  await delay(400)
  maybeThrowError()

  const code = inviteCode.trim().toUpperCase()
  const rec = Object.values(db.leaguesById).find(
    (r) => r.league.inviteCode.toUpperCase() === code,
  )

  if (!rec) throw new Error('Invalid invite code')

  if (rec.members.some((m) => m.userId === userId)) {
    // Already a member.
    const member = rec.members.find((m) => m.userId === userId)!
    return { ...rec.league, members: rec.members, role: member.role }
  }

  if (rec.members.length >= rec.teams.length) {
    throw new Error('League is full')
  }

  const nextMember: LeagueMember = {
    userId,
    role: LeagueRoleValues.MEMBER,
    displayName: 'Player',
  }

  rec.members.push(nextMember)
  persistDb(db)

  return { ...rec.league, members: rec.members, role: nextMember.role }
}

export async function getLeagueSettings(leagueId: LeagueId, userId: UserId): Promise<LeagueSettings> {
  await delay(220)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  return {
    leagueId: rec.league.id,
    leagueName: rec.league.name,
    sport: rec.league.sport,
    inviteCode: rec.league.inviteCode,
    teamCount: rec.teams.length,
    ...rec.settings,
  }
}

export async function updateLeagueSettings(
  leagueId: LeagueId,
  userId: UserId,
  input: UpdateLeagueSettingsInput,
): Promise<LeagueSettings> {
  await delay(350)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  if (member.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Only commissioner can edit settings')

  if (input.leagueName) {
    const name = input.leagueName.trim()
    if (name.length < 3) throw new Error('League name must be at least 3 characters')
    rec.league.name = name
  }
  if (typeof input.isPrivate === 'boolean') {
    rec.settings.isPrivate = input.isPrivate
  }
  if (input.draftType) {
    rec.settings.draftType = input.draftType
    rec.draftBase.draftType = input.draftType
  }
  if (typeof input.draftPickSeconds === 'number') {
    const bounded = Math.max(15, Math.min(120, Math.floor(input.draftPickSeconds)))
    rec.settings.draftPickSeconds = bounded
  }
  if (typeof input.autoPickEnabled === 'boolean') {
    rec.settings.autoPickEnabled = input.autoPickEnabled
  }
  if (typeof input.draftRounds === 'number') {
    rec.settings.draftRounds = Math.max(2, Math.min(20, Math.floor(input.draftRounds)))
  }
  if (input.scoringPreset) {
    rec.settings.scoringPreset = input.scoringPreset
  }
  if (typeof input.pointsPassTd === 'number') rec.settings.pointsPassTd = Math.max(0, Math.min(10, input.pointsPassTd))
  if (typeof input.pointsRushTd === 'number') rec.settings.pointsRushTd = Math.max(0, Math.min(10, input.pointsRushTd))
  if (typeof input.pointsRecTd === 'number') rec.settings.pointsRecTd = Math.max(0, Math.min(10, input.pointsRecTd))
  if (typeof input.pointsReception === 'number') rec.settings.pointsReception = Math.max(0, Math.min(3, input.pointsReception))
  if (typeof input.addDropEnabled === 'boolean') rec.settings.addDropEnabled = input.addDropEnabled
  if (input.tradeApproval) rec.settings.tradeApproval = input.tradeApproval

  pushAuditEvent(
    rec,
    'SETTINGS_UPDATED',
    'Commissioner updated league settings.',
    getMemberDisplayName(rec, userId),
  )

  persistDb(db)
  return getLeagueSettings(leagueId, userId)
}

export async function regenerateLeagueInviteCode(leagueId: LeagueId, userId: UserId): Promise<string> {
  await delay(250)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  if (member.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Only commissioner can regenerate invite codes')

  rec.league.inviteCode = `NP${Math.floor(random() * 900000 + 100000)}`
  pushAuditEvent(
    rec,
    'INVITE_REGENERATED',
    `Invite code regenerated to ${rec.league.inviteCode}.`,
    getMemberDisplayName(rec, userId),
  )
  persistDb(db)
  return rec.league.inviteCode
}

export async function updateLeagueMemberRole(
  leagueId: LeagueId,
  actorUserId: UserId,
  targetUserId: UserId,
  role: 'MEMBER' | 'COMMISSIONER',
): Promise<LeagueMember[]> {
  await delay(260)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const actor = rec.members.find((m) => m.userId === actorUserId)
  if (!actor) throw new Error('Not authorized')
  if (actor.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Only commissioner can update member roles')

  const target = rec.members.find((m) => m.userId === targetUserId)
  if (!target) throw new Error('Member not found')

  if (role === 'COMMISSIONER') {
    rec.members = rec.members.map((m) =>
      m.userId === targetUserId
        ? { ...m, role: LeagueRoleValues.COMMISSIONER }
        : m.userId === actorUserId
          ? { ...m, role: LeagueRoleValues.MEMBER }
          : m,
    )
  } else {
    target.role = LeagueRoleValues.MEMBER
    if (!rec.members.some((m) => m.role === LeagueRoleValues.COMMISSIONER)) {
      throw new Error('League must have at least one commissioner')
    }
  }

  pushAuditEvent(
    rec,
    'MEMBER_ROLE_CHANGED',
    `Role for ${target.displayName} changed to ${role}.`,
    getMemberDisplayName(rec, actorUserId),
  )

  persistDb(db)
  return rec.members.slice()
}

export async function removeLeagueMember(
  leagueId: LeagueId,
  actorUserId: UserId,
  targetUserId: UserId,
): Promise<LeagueMember[]> {
  await delay(260)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const actor = rec.members.find((m) => m.userId === actorUserId)
  if (!actor) throw new Error('Not authorized')
  if (actor.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Only commissioner can remove members')
  if (actorUserId === targetUserId) throw new Error('Commissioner cannot remove themselves')

  const target = rec.members.find((m) => m.userId === targetUserId)
  if (!target) throw new Error('Member not found')
  if (target.role === LeagueRoleValues.COMMISSIONER) {
    throw new Error('Transfer commissioner role before removing this member')
  }

  rec.members = rec.members.filter((m) => m.userId !== targetUserId)
  pushAuditEvent(
    rec,
    'MEMBER_REMOVED',
    `${target.displayName} was removed from the league.`,
    getMemberDisplayName(rec, actorUserId),
  )
  persistDb(db)
  return rec.members.slice()
}

function getTotalDraftPicks(rec: LeagueRecord) {
  return rec.teams.length * rec.settings.draftRounds
}

function advanceDraftPointer(rec: LeagueRecord) {
  rec.draftBase.currentOverallPick += 1
  const totalPicks = getTotalDraftPicks(rec)
  if (rec.draftBase.currentOverallPick > totalPicks) {
    rec.draftBase.status = LeagueStateValues.COMPLETE
    rec.league.state = LeagueStateValues.SEASON_ACTIVE
    return
  }
  const order = buildSnakeDraftOrder(rec.teams.map((t) => t.id), totalPicks)
  const nextTeamId = order[rec.draftBase.currentOverallPick - 1]
  if (!nextTeamId) {
    rec.draftBase.status = LeagueStateValues.COMPLETE
    rec.league.state = LeagueStateValues.SEASON_ACTIVE
    return
  }
  rec.draftBase.currentTeamId = nextTeamId
  rec.draftBase.currentTeamName =
    rec.teams.find((t) => t.id === nextTeamId)?.name ?? rec.draftBase.currentTeamName
  rec.draftBase.timerEndsAt = addSeconds(new Date(), rec.settings.draftPickSeconds).toISOString()
  const nextMeta = computeRoundAndPickInRound(rec.draftBase.currentOverallPick, rec.teams.length)
  rec.draftBase.currentRound = nextMeta.round
  rec.draftBase.currentPickInRound = nextMeta.pickInRound
}

function autoPickCurrentTeam(rec: LeagueRecord, reason: 'timeout' | 'commissioner_skip') {
  const currentTeam = rec.teams.find((t) => t.id === rec.draftBase.currentTeamId)
  if (!currentTeam) return

  const available = rec.players
    .filter((p) => !p.drafted)
    .sort((a, b) => b.projectedPoints - a.projectedPoints)
  const pick = available[0]
  if (!pick) {
    rec.draftBase.status = LeagueStateValues.COMPLETE
    rec.league.state = LeagueStateValues.SEASON_ACTIVE
    return
  }

  pick.drafted = true
  currentTeam.rosterPlayerIds.push(pick.id)
  if (currentTeam.lineup.starters.length < rec.settings.lineupStarters) {
    currentTeam.lineup.starters.push(pick.id)
  } else {
    currentTeam.lineup.bench.push(pick.id)
  }

  const { round, pickInRound } = computeRoundAndPickInRound(
    rec.draftBase.currentOverallPick,
    rec.teams.length,
  )
  rec.draftBase.picks.push({
    overallPick: rec.draftBase.currentOverallPick,
    round,
    pickInRound,
    teamId: currentTeam.id,
    playerId: pick.id,
    teamName: currentTeam.name,
    playerName: pick.name,
    pickedByUserId: currentTeam.ownerUserId,
    isAuto: true,
    pickedAt: safeNowIso(),
  })
  if (reason === 'commissioner_skip' && !rec.autoDraftTeamIds.includes(currentTeam.id)) {
    rec.autoDraftTeamIds.push(currentTeam.id)
  }
  pushAuditEvent(
    rec,
    'AUTO_PICK',
    reason === 'commissioner_skip'
      ? `Commissioner skipped ${currentTeam.name}; auto-drafted ${pick.name} and enabled auto mode for that team.`
      : `Auto-pick #${rec.draftBase.currentOverallPick}: ${pick.name} to ${currentTeam.name}.`,
    reason === 'commissioner_skip' ? 'Commissioner' : 'System',
  )
  advanceDraftPointer(rec)
}

function runAutoDraftIfExpired(rec: LeagueRecord) {
  if (rec.draftBase.status !== LeagueStateValues.DRAFT_IN_PROGRESS) {
    return
  }
  const now = Date.now()
  let guard = 0

  while (
    rec.draftBase.status === LeagueStateValues.DRAFT_IN_PROGRESS &&
    guard < 50
  ) {
    const currentTeam = rec.teams.find((t) => t.id === rec.draftBase.currentTeamId)
    if (!currentTeam) break
    const timedOut = new Date(rec.draftBase.timerEndsAt).getTime() <= now
    const teamForcedAuto = rec.autoDraftTeamIds.includes(currentTeam.id)
    // Plain-language behavior:
    // - timed out + league auto-pick enabled => auto pick
    // - team explicitly marked auto by commissioner => always auto pick on turn
    const shouldAutoPick = teamForcedAuto || (rec.settings.autoPickEnabled && timedOut)
    if (!shouldAutoPick) break
    guard += 1
    autoPickCurrentTeam(rec, 'timeout')
  }
}

export async function getDraftState(leagueId: LeagueId, userId: UserId): Promise<DraftState> {
  await delay(350)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  runAutoDraftIfExpired(rec)
  persistDb(db)

  const currentTeam = rec.teams.find((t) => t.id === rec.draftBase.currentTeamId)
  if (!currentTeam) throw new Error('Draft turn invalid')

  const isCurrentUserTurn =
    currentTeam.ownerUserId === userId &&
    rec.draftBase.status === LeagueStateValues.DRAFT_IN_PROGRESS

  return {
    ...rec.draftBase,
    status: rec.draftBase.status,
    currentTeamName: currentTeam.name,
    autoDraftTeamIds: rec.autoDraftTeamIds.slice(),
    isCurrentUserTurn,
  }
}

export async function commissionerStartDraft(leagueId: LeagueId, userId: UserId): Promise<DraftState> {
  await delay(300)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  if (member.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Forbidden')

  rec.league.state = LeagueStateValues.DRAFT_IN_PROGRESS
  rec.draftBase.status = LeagueStateValues.DRAFT_IN_PROGRESS
  rec.draftBase.currentTeamName =
    rec.teams.find((t) => t.id === rec.draftBase.currentTeamId)?.name ?? rec.draftBase.currentTeamName
  rec.draftBase.timerEndsAt = addSeconds(new Date(), rec.settings.draftPickSeconds).toISOString()
  pushAuditEvent(
    rec,
    'STATE_CHANGED',
    'Draft started by commissioner.',
    getMemberDisplayName(rec, userId),
  )
  persistDb(db)

  return getDraftState(leagueId, userId)
}

export async function commissionerPauseDraft(leagueId: LeagueId, userId: UserId): Promise<DraftState> {
  await delay(300)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  if (member.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Forbidden')

  rec.league.state = LeagueStateValues.DRAFT_SCHEDULED
  rec.draftBase.status = LeagueStateValues.DRAFT_SCHEDULED
  rec.draftBase.timerEndsAt = addSeconds(new Date(), 120).toISOString()
  pushAuditEvent(
    rec,
    'STATE_CHANGED',
    'Draft paused by commissioner.',
    getMemberDisplayName(rec, userId),
  )
  persistDb(db)

  return getDraftState(leagueId, userId)
}

export async function commissionerSetTeamAutoDraft(
  leagueId: LeagueId,
  userId: UserId,
  teamId: TeamId,
  enabled: boolean,
): Promise<DraftState> {
  await delay(220)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  if (member.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Forbidden')

  const team = rec.teams.find((t) => t.id === teamId)
  if (!team) throw new Error('Team not found')
  const hasAuto = rec.autoDraftTeamIds.includes(teamId)
  if (enabled && !hasAuto) rec.autoDraftTeamIds.push(teamId)
  if (!enabled && hasAuto) rec.autoDraftTeamIds = rec.autoDraftTeamIds.filter((id) => id !== teamId)

  pushAuditEvent(
    rec,
    'SETTINGS_UPDATED',
    `${team.name} auto-draft ${enabled ? 'enabled' : 'disabled'}.`,
    getMemberDisplayName(rec, userId),
  )
  persistDb(db)
  return getDraftState(leagueId, userId)
}

export async function commissionerSkipCurrentPick(
  leagueId: LeagueId,
  userId: UserId,
): Promise<DraftState> {
  await delay(260)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  if (member.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Forbidden')
  if (rec.draftBase.status !== LeagueStateValues.DRAFT_IN_PROGRESS) {
    throw new Error('Draft is not in progress')
  }

  // Handoff note:
  // "Skip pick" is intentionally demo-friendly. It makes one auto-pick now
  // and marks that team for future auto-picks so the draft keeps moving.
  autoPickCurrentTeam(rec, 'commissioner_skip')
  persistDb(db)
  return getDraftState(leagueId, userId)
}

export async function commissionerSetLeagueState(
  leagueId: LeagueId,
  userId: UserId,
  nextState: LeagueState,
): Promise<League> {
  await delay(280)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  if (member.role !== LeagueRoleValues.COMMISSIONER) throw new Error('Forbidden')

  // Handoff note: this is demo-safe state orchestration. Replace this with
  // validated workflow transitions from backend policy endpoints.
  rec.league.state = nextState

  if (nextState === LeagueStateValues.DRAFT_SCHEDULED) {
    rec.draftBase.status = LeagueStateValues.DRAFT_SCHEDULED
    rec.draftBase.timerEndsAt = addSeconds(new Date(), 1800).toISOString()
  } else if (nextState === LeagueStateValues.DRAFT_IN_PROGRESS) {
    rec.draftBase.status = LeagueStateValues.DRAFT_IN_PROGRESS
    rec.draftBase.timerEndsAt = addSeconds(new Date(), 45).toISOString()
  } else if (
    nextState === LeagueStateValues.SEASON_ACTIVE ||
    nextState === LeagueStateValues.PLAYOFFS ||
    nextState === LeagueStateValues.COMPLETE
  ) {
    rec.draftBase.status = LeagueStateValues.COMPLETE
  } else {
    rec.draftBase.status = LeagueStateValues.DRAFT_SCHEDULED
  }

  pushAuditEvent(
    rec,
    'STATE_CHANGED',
    `League state moved to ${nextState}.`,
    getMemberDisplayName(rec, userId),
  )

  persistDb(db)

  return {
    ...rec.league,
    members: rec.members,
    role: member.role,
  }
}

export async function submitDraftPick(
  leagueId: LeagueId,
  userId: UserId,
  playerId: PlayerId,
): Promise<DraftState> {
  await delay(550)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  if (rec.draftBase.status !== LeagueStateValues.DRAFT_IN_PROGRESS) {
    throw new Error('Draft is not in progress')
  }

  const currentTeam = rec.teams.find((t) => t.id === rec.draftBase.currentTeamId)
  if (!currentTeam) throw new Error('Draft turn invalid')

  if (currentTeam.ownerUserId !== userId) {
    throw new Error('Not your pick')
  }

  const player = rec.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Player not found')
  if (player.drafted) throw new Error('Player already drafted')

  // Pick rules: only allow picking if roster size not exceeded (simple cap).
  const rosterCap = rec.settings.rosterCap
  if (currentTeam.rosterPlayerIds.length >= rosterCap) {
    throw new Error('Roster full')
  }

  const overallPick = rec.draftBase.currentOverallPick
  const { round, pickInRound } = computeRoundAndPickInRound(
    overallPick,
    rec.teams.length,
  )

  const nextPickedAt = safeNowIso()

  const newPick: DraftPick = {
    overallPick,
    round,
    pickInRound,
    teamId: currentTeam.id,
    playerId: player.id,
    teamName: currentTeam.name,
    playerName: player.name,
    pickedByUserId: userId,
    isAuto: false,
    pickedAt: nextPickedAt,
  }

  rec.draftBase.picks.push(newPick)
  pushAuditEvent(
    rec,
    'MANUAL_PICK',
    `Pick #${overallPick}: ${player.name} to ${currentTeam.name}.`,
    getMemberDisplayName(rec, userId),
  )
  rec.players = rec.players.map((p) => (p.id === player.id ? { ...p, drafted: true } : p))
  currentTeam.rosterPlayerIds.push(player.id)

  // Starter/bench heuristic: first N go to starters, rest to bench.
  const startersTarget = rec.settings.lineupStarters
  currentTeam.lineup.starters = currentTeam.rosterPlayerIds.slice(0, startersTarget)
  currentTeam.lineup.bench = currentTeam.rosterPlayerIds.slice(startersTarget)

  advanceDraftPointer(rec)

  persistDb(db)
  return getDraftState(leagueId, userId)
}

export async function getMyTeamState(leagueId: LeagueId, userId: UserId): Promise<TeamState> {
  await delay(320)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const team = rec.teams.find((t) => t.ownerUserId === userId)
  if (!team) throw new Error('Team not found')

  const isLineupLocked = isAfter(new Date(), new Date(team.lineupLockAt))

  const weekScoring =
    team.rosterPlayerIds.length > 0 ? buildTeamWeekScoring(rec, team, 1) : undefined

  return {
    leagueId,
    team,
    isLineupLocked,
    rosterCap: rec.settings.rosterCap,
    weekScoring,
  }
}

export type UpdateLineupInput = {
  starters: PlayerId[]
  bench: PlayerId[]
}

export async function updateLineup(
  leagueId: LeagueId,
  userId: UserId,
  input: UpdateLineupInput,
): Promise<TeamState> {
  await delay(450)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const team = rec.teams.find((t) => t.ownerUserId === userId)
  if (!team) throw new Error('Team not found')

  if (isAfter(new Date(), new Date(team.lineupLockAt))) {
    throw new Error('Lineup locked')
  }

  const rosterSet = new Set(team.rosterPlayerIds)
  const starters = input.starters.filter((id) => rosterSet.has(id))
  const bench = input.bench.filter((id) => rosterSet.has(id))

  team.lineup.starters = starters
  team.lineup.bench = bench

  persistDb(db)

  return getMyTeamState(leagueId, userId)
}

export async function addPlayerToMyTeam(
  leagueId: LeagueId,
  userId: UserId,
  playerId: PlayerId,
): Promise<TeamState> {
  await delay(420)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const team = rec.teams.find((t) => t.ownerUserId === userId)
  if (!team) throw new Error('Team not found')
  if (!rec.settings.addDropEnabled) throw new Error('Add/drop is disabled by commissioner settings')
  if (isAfter(new Date(), new Date(team.lineupLockAt))) throw new Error('Lineup locked')

  if (team.rosterPlayerIds.length >= rec.settings.rosterCap) {
    throw new Error(`Roster full (${rec.settings.rosterCap}/${rec.settings.rosterCap}). Drop a player first.`)
  }

  const player = rec.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Player not found')
  if (player.drafted) throw new Error('Player is not available')

  player.drafted = true
  team.rosterPlayerIds.push(player.id)
  if (team.lineup.starters.length < rec.settings.lineupStarters) {
    team.lineup.starters.push(player.id)
  } else {
    team.lineup.bench.push(player.id)
  }

  pushAuditEvent(
    rec,
    'ADD_DROP',
    `${getMemberDisplayName(rec, userId)} added ${player.name}.`,
    getMemberDisplayName(rec, userId),
  )

  persistDb(db)
  return getMyTeamState(leagueId, userId)
}

export async function dropPlayerFromMyTeam(
  leagueId: LeagueId,
  userId: UserId,
  playerId: PlayerId,
): Promise<TeamState> {
  await delay(380)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const team = rec.teams.find((t) => t.ownerUserId === userId)
  if (!team) throw new Error('Team not found')
  if (!rec.settings.addDropEnabled) throw new Error('Add/drop is disabled by commissioner settings')
  if (isAfter(new Date(), new Date(team.lineupLockAt))) throw new Error('Lineup locked')
  if (!team.rosterPlayerIds.includes(playerId)) throw new Error('Player is not on your roster')

  team.rosterPlayerIds = team.rosterPlayerIds.filter((id) => id !== playerId)
  team.lineup.starters = team.lineup.starters.filter((id) => id !== playerId)
  team.lineup.bench = team.lineup.bench.filter((id) => id !== playerId)

  const player = rec.players.find((p) => p.id === playerId)
  if (player) player.drafted = false

  pushAuditEvent(
    rec,
    'ADD_DROP',
    `${getMemberDisplayName(rec, userId)} dropped ${player?.name ?? 'a player'}.`,
    getMemberDisplayName(rec, userId),
  )

  persistDb(db)
  return getMyTeamState(leagueId, userId)
}

export type PlayerQuery = {
  search?: string
  position?: string
  team?: string
  status?: PlayerStatus
  drafted?: 'any' | 'available' | 'drafted'
  sort?: 'projectedPoints_desc' | 'name_asc'
}

export async function getPlayers(leagueId: LeagueId, userId: UserId, query: PlayerQuery = {}): Promise<Player[]> {
  await delay(360)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const search = (query.search ?? '').trim().toLowerCase()
  const position = query.position?.trim()
  const team = query.team?.trim()
  const status = query.status

  let players = rec.players.slice()

  if (search) {
    players = players.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.team.toLowerCase().includes(search),
    )
  }

  if (position) {
    players = players.filter((p) => p.position === position)
  }

  if (team) {
    players = players.filter((p) => p.team === team)
  }

  if (status) {
    players = players.filter((p) => p.status === status)
  }

  if (query.drafted === 'available') {
    players = players.filter((p) => !p.drafted)
  } else if (query.drafted === 'drafted') {
    players = players.filter((p) => p.drafted)
  }

  const sort = query.sort ?? 'projectedPoints_desc'
  players.sort((a, b) => {
    if (sort === 'name_asc') return a.name.localeCompare(b.name)
    return b.projectedPoints - a.projectedPoints
  })

  return players
}

function statSeed(playerId: string) {
  return playerId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

type ScoringWeights = Pick<
  LeagueSettings,
  'pointsPassTd' | 'pointsRushTd' | 'pointsRecTd' | 'pointsReception'
>

function mkLineCount(label: string, quantity: number, pointsPerUnit: number): ScoringLine | null {
  if (quantity <= 0 || pointsPerUnit <= 0) return null
  const points = Math.round(quantity * pointsPerUnit * 10) / 10
  if (points <= 0) return null
  return { label, quantity, pointsPerUnit, points }
}

function mkLineYards(
  label: string,
  yards: number,
  yardsDivisor: number,
  pointsPerUnit: number,
): ScoringLine | null {
  if (yards <= 0 || yardsDivisor <= 0 || pointsPerUnit <= 0) return null
  const points = Math.round((yards / yardsDivisor) * pointsPerUnit * 10) / 10
  if (points <= 0) return null
  return { label, quantity: yards, pointsPerUnit, yardsDivisor, points }
}

/**
 * Deterministic mock: each row is value × rate → fantasy pts (no magic scaling).
 * List “projectedPoints” may differ slightly; FR uses one scoring engine end-to-end.
 */
function buildPlayerScoringBreakdown(
  player: Player,
  sport: Sport,
  settings: ScoringWeights,
): PlayerScoringBreakdown {
  const seed = statSeed(player.id)
  const lines: ScoringLine[] = []

  if (sport === 'football') {
    const passTd = seed % 4
    const rushTd = (seed >> 3) % 3
    const recTd = (seed >> 5) % 3
    const rec = 2 + (seed % 12)
    const rushYds = 20 + (seed % 120)
    const passYds = 80 + (seed % 220)
    const recYds = rec * 9
    const push = (L: ScoringLine | null) => {
      if (L) lines.push(L)
    }
    push(mkLineYards('Passing yards', passYds, 25, 1))
    push(mkLineCount('Pass TD', passTd, settings.pointsPassTd))
    push(mkLineYards('Rushing yards', rushYds, 10, 1))
    push(mkLineCount('Rush TD', rushTd, settings.pointsRushTd))
    push(mkLineYards('Receiving yards', recYds, 10, 1))
    push(mkLineCount('Rec TD', recTd, settings.pointsRecTd))
    push(mkLineCount('Receptions', rec, settings.pointsReception))
  } else if (sport === 'basketball') {
    const pts = 8 + (seed % 28)
    const reb = 2 + (seed % 12)
    const ast = 1 + (seed % 14)
    const stl = seed % 4
    const blk = seed % 3
    const pushBb = (L: ScoringLine | null) => {
      if (L) lines.push(L)
    }
    pushBb(mkLineCount('Points', pts, 1))
    pushBb(mkLineCount('Rebounds', reb, 1.2))
    pushBb(mkLineCount('Assists', ast, 1.5))
    pushBb(mkLineCount('Steals', stl, 2))
    pushBb(mkLineCount('Blocks', blk, 2))
  } else {
    const h = 1 + (seed % 4)
    const hr = seed % 3
    const r = seed % 4
    const rbi = seed % 5
    const sb = seed % 2
    const pushBb = (L: ScoringLine | null) => {
      if (L) lines.push(L)
    }
    pushBb(mkLineCount('Hits', h, 3))
    pushBb(mkLineCount('Home runs', hr, 6))
    pushBb(mkLineCount('Runs', r, 2))
    pushBb(mkLineCount('RBI', rbi, 2))
    pushBb(mkLineCount('Stolen bases', sb, 2))
  }

  if (lines.length === 0) {
    const t = Math.round(Math.max(0.1, player.projectedPoints) * 10) / 10
    lines.push({
      label: 'Projection (mock)',
      quantity: 1,
      pointsPerUnit: t,
      points: t,
    })
  }

  const fantasyTotal = Math.round(lines.reduce((a, l) => a + l.points, 0) * 10) / 10

  return {
    fantasyTotal,
    isProjected: true,
    lines,
  }
}

function buildTeamWeekScoring(
  rec: { league: { sport: Sport }; players: Player[]; settings: ScoringWeights },
  team: FantasyTeam,
  week: number,
): TeamWeekScoring {
  const sport = rec.league.sport
  const settings = rec.settings

  const mapSlot = (playerId: PlayerId): StarterWeekScoring | null => {
    const p = rec.players.find((x) => x.id === playerId)
    if (!p) return null
    return {
      playerId,
      playerName: p.name,
      position: p.position,
      breakdown: buildPlayerScoringBreakdown(p, sport, settings),
    }
  }

  const starters = team.lineup.starters.map(mapSlot).filter(Boolean) as StarterWeekScoring[]
  const bench = team.lineup.bench.map(mapSlot).filter(Boolean) as StarterWeekScoring[]
  const starterTotal =
    Math.round(starters.reduce((a, s) => a + s.breakdown.fantasyTotal, 0) * 10) / 10
  const benchTotal =
    Math.round(bench.reduce((a, s) => a + s.breakdown.fantasyTotal, 0) * 10) / 10

  return { week, starters, bench, starterTotal, benchTotal }
}

function sumTeamStartersProjection(rec: LeagueRecord, teamId: TeamId): number {
  const team = rec.teams.find((t) => t.id === teamId)
  if (!team) return 0
  const sport = rec.league.sport
  const settings = rec.settings
  let sum = 0
  for (const pid of team.lineup.starters) {
    const p = rec.players.find((x) => x.id === pid)
    if (p) {
      sum += buildPlayerScoringBreakdown(p, sport, settings).fantasyTotal
    }
  }
  return Math.round(sum * 10) / 10
}

/**
 * Keeps mock honest: matchup **projected** side = sum of each team's starter projections (same as Team page).
 * Final scores stay on completed games. FR: one scoring service feeds both views.
 */
function syncMatchupProjectionsFromStartersForWeek(rec: LeagueRecord, week: number) {
  const list = rec.matchupsByWeek[week]
  if (!list?.length) return
  let changed = false
  for (const m of list) {
    if (m.status === 'FINAL') continue
    const hp = sumTeamStartersProjection(rec, m.homeTeamId)
    const ap = sumTeamStartersProjection(rec, m.awayTeamId)
    if (m.homeProjected !== hp) {
      m.homeProjected = hp
      changed = true
    }
    if (m.awayProjected !== ap) {
      m.awayProjected = ap
      changed = true
    }
  }
  if (changed) persistDb(db)
}

export async function getPlayerById(leagueId: LeagueId, userId: UserId, playerId: PlayerId): Promise<Player> {
  await delay(220)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const player = rec.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Player not found')
  const scoringBreakdown = buildPlayerScoringBreakdown(player, rec.league.sport, rec.settings)
  return { ...player, scoringBreakdown }
}

function isSeasonLikeState(state: LeagueState) {
  return (
    state === LeagueStateValues.SEASON_ACTIVE ||
    state === LeagueStateValues.PLAYOFFS ||
    state === LeagueStateValues.COMPLETE
  )
}

function isMockDevDemoEnabled() {
  try {
    return (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem(NEXTPLAY_DEV_MODE_STORAGE_KEY) === '1'
    )
  } catch {
    return false
  }
}

/**
 * Dev / demo only: fills empty season shells so Matchups + Standings record well.
 * Off when Dev mode is off so the app matches a production-shaped (often empty) API.
 */
function ensureSeasonDemoData(rec: LeagueRecord) {
  if (!isSeasonLikeState(rec.league.state)) return
  if (rec.teams.length < 2) return

  const hasMatchups = Object.keys(rec.matchupsByWeek).some(
    (k) => (rec.matchupsByWeek[Number(k)] ?? []).length > 0,
  )
  if (hasMatchups && rec.standings.length > 0) return

  const teams = rec.teams
  const leagueId = rec.league.id
  const n = teams.length
  const matchupsByWeek: Record<number, Matchup[]> = {}

  for (let w = 1; w <= 4; w++) {
    const week: Matchup[] = []
    for (let i = 0; i + 1 < n; i += 2) {
      const home = teams[i]!
      const away = teams[i + 1]!
      const seed = (home.id.charCodeAt(0) + away.id.charCodeAt(0) + w * 17) % 35
      const hp = 74 + (seed % 22)
      const ap = 72 + ((seed + 5) % 20)
      const isFinal = w <= 2
      const status = isFinal ? 'FINAL' : w === 3 ? 'LIVE' : 'UPCOMING'
      const homeProjected = Math.round(hp * 10) / 10
      const awayProjected = Math.round(ap * 10) / 10
      week.push({
        id: makeId('m', `${leagueId}_auto_w${w}_${home.id}_${away.id}`),
        week: w,
        homeTeamId: home.id,
        homeTeamName: home.name,
        awayTeamId: away.id,
        awayTeamName: away.name,
        status,
        homeScore: isFinal ? Math.round(homeProjected + (w % 4) + 2) : undefined,
        awayScore: isFinal ? Math.round(awayProjected - (w % 3)) : undefined,
        homeProjected,
        awayProjected,
      })
    }
    matchupsByWeek[w] = week
  }

  const rows = new Map<TeamId, StandingRow>()
  for (const t of teams) {
    rows.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      rank: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    })
  }
  for (const m of Object.values(matchupsByWeek).flat()) {
    if (m.status !== 'FINAL' || m.homeScore == null || m.awayScore == null) continue
    const h = rows.get(m.homeTeamId)!
    const a = rows.get(m.awayTeamId)!
    h.pointsFor += m.homeScore
    h.pointsAgainst += m.awayScore
    a.pointsFor += m.awayScore
    a.pointsAgainst += m.homeScore
    if (m.homeScore > m.awayScore) {
      h.wins += 1
      a.losses += 1
    } else if (m.awayScore > m.homeScore) {
      a.wins += 1
      h.losses += 1
    }
  }

  const sorted = [...rows.values()].sort(
    (a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor || a.pointsAgainst - b.pointsAgainst,
  )
  sorted.forEach((r, idx) => {
    r.rank = idx + 1
  })

  rec.matchupsByWeek = matchupsByWeek
  rec.standings = sorted
  persistDb(db)
}

export async function getMatchups(
  leagueId: LeagueId,
  userId: UserId,
  week: number,
): Promise<Matchup[]> {
  await delay(350)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  if (isMockDevDemoEnabled()) ensureSeasonDemoData(rec)
  syncMatchupProjectionsFromStartersForWeek(rec, week)
  return rec.matchupsByWeek[week] ?? []
}

export async function getStandings(leagueId: LeagueId, userId: UserId): Promise<StandingRow[]> {
  await delay(320)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  if (isMockDevDemoEnabled()) ensureSeasonDemoData(rec)
  return rec.standings.slice().sort((a, b) => a.rank - b.rank)
}

export async function getLeagueAuditEvents(
  leagueId: LeagueId,
  userId: UserId,
): Promise<LeagueAuditEvent[]> {
  await delay(220)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  if (member.role !== LeagueRoleValues.COMMISSIONER) {
    throw new Error('Only commissioner can view audit events')
  }

  return rec.auditEvents.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getPlayoffBracket(leagueId: LeagueId, userId: UserId): Promise<PlayoffMatch[]> {
  await delay(260)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  if (rec.standings.length < 4) return []
  const seeds = rec.standings.slice().sort((a, b) => a.rank - b.rank).slice(0, 4)
  const allMatches = Object.values(rec.matchupsByWeek).flat()
  const lastWeek = allMatches.length ? Math.max(...allMatches.map((m) => m.week)) : 0
  const lastWeekMatches = allMatches.filter((m) => m.week === lastWeek).slice(0, 2)

  const momentum = (teamName: string) =>
    allMatches.reduce((acc, m) => {
      if (m.homeTeamName === teamName) return acc + ((m.homeScore ?? 0) - (m.awayScore ?? 0))
      if (m.awayTeamName === teamName) return acc + ((m.awayScore ?? 0) - (m.homeScore ?? 0))
      return acc
    }, 0)

  const semiTeams: Array<[typeof seeds[number], typeof seeds[number]]> = [
    [seeds[0]!, seeds[3]!],
    [seeds[1]!, seeds[2]!],
  ]

  const semifinals: PlayoffMatch[] = semiTeams.map(([a, b], idx) => {
    const fallbackScoreA = 80 + Math.max(-8, Math.min(12, momentum(a.teamName)))
    const fallbackScoreB = 80 + Math.max(-8, Math.min(12, momentum(b.teamName)))
    const weekMatch = lastWeekMatches[idx]
    const scoreA =
      rec.league.state === LeagueStateValues.PLAYOFFS || rec.league.state === LeagueStateValues.COMPLETE
        ? weekMatch?.homeTeamName === a.teamName
          ? weekMatch.homeScore ?? fallbackScoreA
          : weekMatch?.awayTeamName === a.teamName
            ? weekMatch.awayScore ?? fallbackScoreA
            : fallbackScoreA
        : null
    const scoreB =
      rec.league.state === LeagueStateValues.PLAYOFFS || rec.league.state === LeagueStateValues.COMPLETE
        ? weekMatch?.homeTeamName === b.teamName
          ? weekMatch.homeScore ?? fallbackScoreB
          : weekMatch?.awayTeamName === b.teamName
            ? weekMatch.awayScore ?? fallbackScoreB
            : fallbackScoreB
        : null
    const winner = scoreA != null && scoreB != null ? (scoreA >= scoreB ? a.teamName : b.teamName) : null
    return {
      id: makeId('po', `${leagueId}_sf_${idx + 1}`),
      round: 'Semifinal',
      seedA: a.rank,
      seedB: b.rank,
      teamA: a.teamName,
      teamB: b.teamName,
      scoreA,
      scoreB,
      winner,
    }
  })

  const finalistA = semifinals[0]!.winner ?? seeds[0]!.teamName
  const finalistB = semifinals[1]!.winner ?? seeds[2]!.teamName
  const finalScoreA = rec.league.state === LeagueStateValues.COMPLETE ? 85 + Math.max(0, momentum(finalistA) % 10) : null
  const finalScoreB = rec.league.state === LeagueStateValues.COMPLETE ? 84 + Math.max(0, momentum(finalistB) % 10) : null

  const final: PlayoffMatch = {
    id: makeId('po', `${leagueId}_f_1`),
    round: 'Final',
    seedA: 1,
    seedB: 2,
    teamA: finalistA,
    teamB: finalistB,
    scoreA: finalScoreA,
    scoreB: finalScoreB,
    winner:
      finalScoreA != null && finalScoreB != null
        ? finalScoreA >= finalScoreB
          ? finalistA
          : finalistB
        : null,
  }

  return [...semifinals, final]
}

export async function getPlayerInsights(
  leagueId: LeagueId,
  userId: UserId,
): Promise<PlayerInsight[]> {
  await delay(200)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  return rec.players.map((p, idx) => ({
    playerId: p.id,
    confidence: idx % 3 === 0 ? 'High' : idx % 3 === 1 ? 'Medium' : 'Low',
    trend: p.projectedPoints >= 30 ? 'up' : 'down',
    volatility: 8 + ((idx * 7) % 32),
  }))
}

export async function getMatchupInsight(
  leagueId: LeagueId,
  userId: UserId,
  matchupId: string,
): Promise<MatchupInsight> {
  await delay(180)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const matchup = Object.values(rec.matchupsByWeek).flat().find((m) => m.id === matchupId)
  if (!matchup) throw new Error('Matchup not found')

  if (matchup.homeProjected != null && matchup.awayProjected != null) {
    const projectedTotal =
      Math.round((matchup.homeProjected + matchup.awayProjected) * 10) / 10
    const diff = matchup.homeProjected - matchup.awayProjected
    const homeWinProbability = Math.max(38, Math.min(62, Math.round(50 + diff * 1.2)))
    return {
      matchupId,
      homeWinProbability,
      awayWinProbability: 100 - homeWinProbability,
      projectedTotal,
      confidence: Math.abs(diff) >= 6 ? 'High' : Math.abs(diff) >= 3 ? 'Medium' : 'Low',
    }
  }

  const base = (matchup.homeTeamId.charCodeAt(0) + matchup.awayTeamId.charCodeAt(0)) % 100
  const homeWinProbability = 45 + (base % 11)
  const awayWinProbability = 100 - homeWinProbability
  return {
    matchupId,
    homeWinProbability,
    awayWinProbability,
    projectedTotal: 140 + (base % 30),
    confidence: homeWinProbability >= 55 ? 'High' : homeWinProbability >= 50 ? 'Medium' : 'Low',
  }
}

export async function getMatchupLineupScoring(
  leagueId: LeagueId,
  userId: UserId,
  matchupId: string,
): Promise<MatchupLineupScoring> {
  await delay(260)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const matchup = Object.values(rec.matchupsByWeek).flat().find((m) => m.id === matchupId)
  if (!matchup) throw new Error('Matchup not found')

  syncMatchupProjectionsFromStartersForWeek(rec, matchup.week)

  const homeTeam = rec.teams.find((t) => t.id === matchup.homeTeamId)
  const awayTeam = rec.teams.find((t) => t.id === matchup.awayTeamId)
  if (!homeTeam || !awayTeam) throw new Error('Team not found')

  const homeWs = buildTeamWeekScoring(rec, homeTeam, matchup.week)
  const awayWs = buildTeamWeekScoring(rec, awayTeam, matchup.week)

  return {
    matchupId: matchup.id,
    week: matchup.week,
    status: matchup.status,
    home: {
      teamId: homeTeam.id,
      teamName: homeTeam.name,
      starterTotal: homeWs.starterTotal,
      starters: homeWs.starters,
    },
    away: {
      teamId: awayTeam.id,
      teamName: awayTeam.name,
      starterTotal: awayWs.starterTotal,
      starters: awayWs.starters,
    },
  }
}

export async function getChatMessages(
  leagueId: LeagueId,
  userId: UserId,
): Promise<ChatMessage[]> {
  await delay(300)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  return rec.chatMessages.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function getMatchupMessages(
  leagueId: LeagueId,
  userId: UserId,
  matchupId: string,
): Promise<ChatMessage[]> {
  await delay(220)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  const matchup = Object.values(rec.matchupsByWeek).flat().find((m) => m.id === matchupId)
  if (!matchup) throw new Error('Matchup not found')
  const userTeam = rec.teams.find((t) => t.ownerUserId === userId)
  const canAccess =
    member.role === LeagueRoleValues.COMMISSIONER ||
    (!!userTeam &&
      (userTeam.id === matchup.homeTeamId || userTeam.id === matchup.awayTeamId))
  if (!canAccess) {
    throw new Error('Only weekly opponents and commissioner can access this board')
  }

  return (rec.matchupMessagesById[matchupId] ?? []).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function postChatMessage(
  leagueId: LeagueId,
  userId: UserId,
  text: string,
): Promise<ChatMessage[]> {
  await delay(420)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')

  const trimmed = text.trim()
  if (!trimmed) throw new Error('Message cannot be empty')

  const msg: ChatMessage = {
    id: makeId('msg', `${leagueId}_${Date.now()}_${trimmed.slice(0, 6)}`),
    leagueId,
    userId,
    displayName: member.displayName,
    text: trimmed.slice(0, 1200),
    createdAt: safeNowIso(),
  }

  rec.chatMessages.push(msg)
  persistDb(db)

  return getChatMessages(leagueId, userId)
}

export async function postMatchupMessage(
  leagueId: LeagueId,
  userId: UserId,
  matchupId: string,
  text: string,
): Promise<ChatMessage[]> {
  await delay(350)
  maybeThrowError()

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')
  const member = rec.members.find((m) => m.userId === userId)
  if (!member) throw new Error('Not authorized')
  const matchup = Object.values(rec.matchupsByWeek).flat().find((m) => m.id === matchupId)
  if (!matchup) throw new Error('Matchup not found')
  const userTeam = rec.teams.find((t) => t.ownerUserId === userId)
  const canAccess =
    member.role === LeagueRoleValues.COMMISSIONER ||
    (!!userTeam &&
      (userTeam.id === matchup.homeTeamId || userTeam.id === matchup.awayTeamId))
  if (!canAccess) {
    throw new Error('Only weekly opponents and commissioner can post here')
  }

  const trimmed = text.trim()
  if (!trimmed) throw new Error('Message cannot be empty')

  const next: ChatMessage = {
    id: makeId('mmsg', `${leagueId}_${matchupId}_${Date.now()}`),
    leagueId,
    userId,
    displayName: member.displayName,
    text: trimmed.slice(0, 300),
    createdAt: safeNowIso(),
  }

  const prev = rec.matchupMessagesById[matchupId] ?? []
  rec.matchupMessagesById[matchupId] = [...prev, next]
  persistDb(db)

  return getMatchupMessages(leagueId, userId, matchupId)
}

export async function devAutoCompleteDraft(
  leagueId: LeagueId,
  _userId: UserId,
): Promise<DraftState> {
  await delay(200)

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  if (
    rec.draftBase.status !== LeagueStateValues.DRAFT_IN_PROGRESS &&
    rec.draftBase.status !== LeagueStateValues.DRAFT_SCHEDULED
  ) {
    throw new Error('Draft is not active')
  }

  rec.league.state = LeagueStateValues.DRAFT_IN_PROGRESS
  rec.draftBase.status = LeagueStateValues.DRAFT_IN_PROGRESS

  let guard = 0
  while (
    rec.draftBase.status === LeagueStateValues.DRAFT_IN_PROGRESS &&
    guard < 200
  ) {
    guard += 1
    autoPickCurrentTeam(rec, 'timeout')
  }

  pushAuditEvent(
    rec,
    'STATE_CHANGED',
    'Draft auto-completed via dev mode.',
    'System',
  )

  persistDb(db)

  const currentTeam = rec.teams.find((t) => t.id === rec.draftBase.currentTeamId)
  return {
    ...rec.draftBase,
    currentTeamName: currentTeam?.name ?? rec.draftBase.currentTeamName,
    autoDraftTeamIds: rec.autoDraftTeamIds.slice(),
    isCurrentUserTurn: false,
  }
}

export async function devSkipPick(
  leagueId: LeagueId,
  userId: UserId,
): Promise<DraftState> {
  await delay(150)

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  if (rec.draftBase.status !== LeagueStateValues.DRAFT_IN_PROGRESS) {
    throw new Error('Draft is not in progress')
  }

  autoPickCurrentTeam(rec, 'commissioner_skip')
  persistDb(db)

  const currentTeam = rec.teams.find((t) => t.id === rec.draftBase.currentTeamId)
  const myTeam = rec.teams.find((t) => t.ownerUserId === userId)
  return {
    ...rec.draftBase,
    currentTeamName: currentTeam?.name ?? rec.draftBase.currentTeamName,
    autoDraftTeamIds: rec.autoDraftTeamIds.slice(),
    isCurrentUserTurn: myTeam ? myTeam.id === rec.draftBase.currentTeamId : false,
  }
}

export async function devForceLeagueState(
  leagueId: LeagueId,
  nextState: LeagueState,
): Promise<void> {
  await delay(100)

  const rec = db.leaguesById[leagueId]
  if (!rec) throw new Error('League not found')

  rec.league.state = nextState

  if (nextState === LeagueStateValues.CREATED) {
    rec.draftBase.status = LeagueStateValues.DRAFT_SCHEDULED
    rec.draftBase.timerEndsAt = addSeconds(new Date(), 1800).toISOString()
  } else if (nextState === LeagueStateValues.DRAFT_SCHEDULED) {
    rec.draftBase.status = LeagueStateValues.DRAFT_SCHEDULED
    rec.draftBase.timerEndsAt = addSeconds(new Date(), 1800).toISOString()
  } else if (nextState === LeagueStateValues.DRAFT_IN_PROGRESS) {
    rec.draftBase.status = LeagueStateValues.DRAFT_IN_PROGRESS
    rec.draftBase.timerEndsAt = addSeconds(new Date(), 45).toISOString()
  } else if (
    nextState === LeagueStateValues.SEASON_ACTIVE ||
    nextState === LeagueStateValues.PLAYOFFS ||
    nextState === LeagueStateValues.COMPLETE
  ) {
    rec.draftBase.status = LeagueStateValues.COMPLETE
  }

  persistDb(db)
}

export async function devResetMockDatabase(): Promise<void> {
  await delay(80)
  const fresh = buildInitialDb()
  for (const key of Object.keys(db.leaguesById)) {
    delete db.leaguesById[key]
  }
  for (const [key, rec] of Object.entries(fresh.leaguesById)) {
    db.leaguesById[key] = rec
  }
  db.nextLeagueCounter = fresh.nextLeagueCounter
  persistDb(db)
}

export async function getTopTickerItems(userId?: UserId): Promise<TickerItem[]> {
  await delay(120)

  const headlines: TickerItem[] = [
    { id: 'h1', label: 'Saturday slate: pace and usage shifts driving projection swings this week.' },
    { id: 'h2', label: 'Injury watch: verify final status updates before lineup lock.' },
    { id: 'h3', label: 'Draft market: skill-position runs continue in middle rounds.' },
    { id: 'h4', label: 'Reminder: lineup lock starts at each game kickoff based on league settings.' },
  ]

  if (!userId) return headlines

  const myLeagues = Object.values(db.leaguesById).filter((rec) =>
    rec.members.some((m) => m.userId === userId),
  )

  const leagueEvents: TickerItem[] = myLeagues.flatMap((rec) => {
    const latestPick = rec.draftBase.picks.at(-1)
    const latestMatchup = Object.values(rec.matchupsByWeek)
      .flat()
      .sort((a, b) => (a.week === b.week ? a.id.localeCompare(b.id) : b.week - a.week))[0]

    const items: TickerItem[] = [
      {
        id: `${rec.league.id}_state`,
        label: `${rec.league.name}: ${rec.league.state.replaceAll('_', ' ')}`,
      },
      {
        id: `${rec.league.id}_members`,
        label: `${rec.league.name}: ${rec.members.length} active members.`,
      },
    ]

    if (latestPick) {
      items.push({
        id: `${rec.league.id}_pick`,
        label: `${rec.league.name}: Pick #${latestPick.overallPick} ${latestPick.playerName} -> ${latestPick.teamName}.`,
      })
    }

    if (latestMatchup) {
      const score =
        latestMatchup.status === 'FINAL'
          ? `${latestMatchup.homeScore ?? 0}-${latestMatchup.awayScore ?? 0}`
          : latestMatchup.status
      items.push({
        id: `${rec.league.id}_matchup`,
        label: `Week ${latestMatchup.week}: ${latestMatchup.homeTeamName} vs ${latestMatchup.awayTeamName} (${score}).`,
      })
    }

    return items
  })

  return [...leagueEvents, ...headlines]
}

