import type { Matchup, Player, PlayerId, StandingRow, UserId } from '@/types/models'
import type { PlayerQuery } from '@/services/mocks/mockNextPlayApi'
import { getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { getJson } from '@/services/api/httpClient'

export * from '@/services/mocks/mockNextPlayApi'

async function getLeagueSport(leagueId: string, userId: UserId) {
  const league = await getMockLeagueById(leagueId, userId)
  return league.sport
}

export async function getPlayers(
  leagueId: string,
  userId: UserId,
  query: PlayerQuery = {},
): Promise<Player[]> {
  const sport = await getLeagueSport(leagueId, userId)

  return getJson<Player[]>(`/api/leagues/${encodeURIComponent(leagueId)}/players`, {
    userId,
    sport,
    search: query.search,
    position: query.position,
    team: query.team,
    status: query.status,
    drafted: query.drafted,
    sort: query.sort,
  })
}

export async function getPlayerById(
  leagueId: string,
  userId: UserId,
  playerId: PlayerId,
): Promise<Player> {
  const sport = await getLeagueSport(leagueId, userId)

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

  return getJson<StandingRow[]>(`/api/leagues/${encodeURIComponent(leagueId)}/standings`, {
    userId,
    sport: league.sport,
  })
}
