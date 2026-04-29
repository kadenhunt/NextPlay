import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/dashboard/DashboardPage'
import { renderRoute } from '@/test/testUtils'

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

describe('COM-06 Interactive elements are named', () => {
  beforeEach(() => {
    listMyLeagues.mockReset()
    createLeague.mockReset()
    devResetMockDatabase.mockReset()
    joinLeagueByInviteCode.mockReset()
  })

  it('gives dashboard action buttons accessible names', async () => {
    listMyLeagues.mockResolvedValue([])

    renderRoute('/dashboard', '/dashboard', <DashboardPage />)

    expect(await screen.findByText('No leagues yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Create League' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Join League' }).length).toBeGreaterThan(0)
  })
})
