import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/dashboard/DashboardPage'
import { renderRoute } from '@/test/testUtils'

import {
  measureAsyncStep,
  PERFORMANCE_THRESHOLDS_MS,
} from './performanceUtils'

const listMyLeagues = vi.fn()
const createLeague = vi.fn()
const devResetMockDatabase = vi.fn()
const joinLeagueByInviteCode = vi.fn()

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user_1', email: 'user@example.com', displayName: 'Player One' },
    emailVerified: true,
    resendVerificationEmail: vi.fn(),
    markEmailVerifiedForDemo: vi.fn(),
  }),
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({
    devMode: false,
  }),
}))

vi.mock('@/services/api/nextplayApi', () => ({
  listMyLeagues: (...args: unknown[]) => listMyLeagues(...args),
  createLeague: (...args: unknown[]) => createLeague(...args),
  devResetMockDatabase: (...args: unknown[]) => devResetMockDatabase(...args),
  joinLeagueByInviteCode: (...args: unknown[]) => joinLeagueByInviteCode(...args),
}))

describe('PERF-02 Dashboard load time', () => {
  beforeEach(() => {
    listMyLeagues.mockReset()
    createLeague.mockReset()
    devResetMockDatabase.mockReset()
    joinLeagueByInviteCode.mockReset()
  })

  it('renders the league dashboard within the MVP threshold', async () => {
    listMyLeagues.mockResolvedValue([
      {
        id: '1',
        name: 'Saturday Lights',
        sport: 'football',
        role: 'COMMISSIONER',
        state: 'CREATED',
        members: [{ userId: 'user_1' }, { userId: 'user_2' }],
      },
      {
        id: '2',
        name: 'Hardwood Pulse',
        sport: 'basketball',
        role: 'MEMBER',
        state: 'DRAFT_IN_PROGRESS',
        members: [{ userId: 'user_1' }, { userId: 'user_2' }, { userId: 'user_3' }],
      },
      {
        id: '3',
        name: 'Diamond Series',
        sport: 'baseball',
        role: 'MEMBER',
        state: 'SEASON_ACTIVE',
        members: [{ userId: 'user_1' }],
      },
    ])

    renderRoute('/dashboard', '/dashboard', <DashboardPage />)

    await measureAsyncStep(
      'PERF-02 dashboard league list load',
      PERFORMANCE_THRESHOLDS_MS.dashboard,
      async () => {
        expect(
          await screen.findByText('Saturday Lights', {}, { timeout: 3000 }),
        ).toBeInTheDocument()
        expect(screen.getByText('Hardwood Pulse')).toBeInTheDocument()
        expect(screen.getByText('Diamond Series')).toBeInTheDocument()
      },
    )
  })
})
