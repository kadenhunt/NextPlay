import { createContext, useContext, useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { getLeagueById } from '@/services/api/nextplayApi'
import type { League, LeagueId, LeagueRole } from '@/types/models'

type LoadState = 'loading' | 'error' | 'ready'

type LeagueContextValue = {
  status: LoadState
  league: League | null
  error: string | null
  userRole: LeagueRole | null
  isCommissioner: boolean
  leagueId: LeagueId | null
}

const LeagueContext = createContext<LeagueContextValue | null>(null)

export default function LeagueProvider({ children }: PropsWithChildren) {
  const { id } = useParams()
  const { user } = useAuth()

  const leagueId = (id ?? null) as LeagueId | null
  const userId = user?.id ?? null

  const query = useQuery({
    queryKey: ['league', leagueId, userId],
    queryFn: () => getLeagueById(leagueId!, userId!),
    enabled: Boolean(leagueId && userId),
  })

  const value = useMemo<LeagueContextValue>(() => {
    if (!leagueId) {
      return {
        status: 'error',
        league: null,
        error: 'League ID missing.',
        userRole: null,
        isCommissioner: false,
        leagueId: null,
      }
    }

    if (query.isLoading) {
      return {
        status: 'loading',
        league: null,
        error: null,
        userRole: null,
        isCommissioner: false,
        leagueId,
      }
    }

    if (query.isError) {
      return {
        status: 'error',
        league: null,
        error: query.error instanceof Error ? query.error.message : 'Failed to load league',
        userRole: null,
        isCommissioner: false,
        leagueId,
      }
    }

    const league = query.data ?? null
    const userRole = league?.role ?? null
    return {
      status: 'ready',
      league,
      error: null,
      userRole,
      isCommissioner: userRole === 'COMMISSIONER',
      leagueId,
    }
  }, [leagueId, query.error, query.data, query.isError, query.isLoading])

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>
}

export function useLeague() {
  const ctx = useContext(LeagueContext)
  if (!ctx) throw new Error('useLeague must be used within LeagueProvider')
  return ctx
}

