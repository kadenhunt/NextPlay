import type { Matchup, Player, PlayerId, StandingRow, UserId } from '@/types/models'
import type { PlayerQuery } from '@/services/mocks/mockNextPlayApi'
import {
  getLeagueById as getMockLeagueById,
  getPlayerById as mockGetPlayerById,
  getPlayers as mockGetPlayers,
} from '@/services/mocks/mockNextPlayApi'
import { getJson } from '@/services/api/httpClient'

export * from '@/services/mocks/mockNextPlayApi'

const DEFAULT_FOOTBALL_YEAR = 2025

type SupportedHttpPlayerQuery = PlayerQuery & {
  year?: number
}

async function getLeagueSport(leagueId: string, userId: UserId) {
  const league = await getMockLeagueById(leagueId, userId)
  console.log('[httpNextPlayApi] resolved sport', { leagueId, userId, sport: league.sport })
  return league.sport
}

export async function getPlayers(
  leagueId: string,
  userId: UserId,
  query: SupportedHttpPlayerQuery = {},
): Promise<Player[]> {
  const sport = await getLeagueSport(leagueId, userId)
  const year = sport === 'football' ? query.year ?? DEFAULT_FOOTBALL_YEAR : query.year

  console.log('[httpNextPlayApi] getPlayers', {
    leagueId,
    userId,
    sport,
    query,
    year,
  })

  if (sport === 'basketball') {
    return mockGetPlayers(leagueId, userId, query)
  }

  return getJson<Player[]>(`/api/leagues/${encodeURIComponent(leagueId)}/players`, {
    userId,
    sport,
    search: query.search,
    position: query.position,
    team: query.team,
    status: query.status,
    drafted: query.drafted,
    sort: query.sort,
    year,
  })
}

export async function getPlayerById(
  leagueId: string,
  userId: UserId,
  playerId: PlayerId,
): Promise<Player> {
  const sport = await getLeagueSport(leagueId, userId)
  console.log('[httpNextPlayApi] getPlayerById', { leagueId, userId, sport, playerId })

  if (sport === 'basketball') {
    return mockGetPlayerById(leagueId, userId, playerId)
  }

  return getJson<Player>(
    `/api/leagues/${encodeURIComponent(leagueId)}/players/${encodeURIComponent(playerId)}`,
    {
      userId,
      sport,
    },
  )
}

export async function getMatchups(
  leagueId: string,
  userId: UserId,
  week: number,
): Promise<Matchup[]> {
  const league = await getMockLeagueById(leagueId, userId)
  console.log('[httpNextPlayApi] getMatchups', {
    leagueId,
    userId,
    sport: league.sport,
    week,
  })

  return getJson<Matchup[]>(`/api/leagues/${encodeURIComponent(leagueId)}/matchups`, {
    userId,
    sport: league.sport,
    week,
  })
}

export async function getStandings(
  leagueId: string,
  userId: UserId,
): Promise<StandingRow[]> {
  const league = await getMockLeagueById(leagueId, userId)
  console.log('[httpNextPlayApi] getStandings', {
    leagueId,
    userId,
    sport: league.sport,
  })

  return getJson<StandingRow[]>(`/api/leagues/${encodeURIComponent(leagueId)}/standings`, {
    userId,
    sport: league.sport,
  })
}
