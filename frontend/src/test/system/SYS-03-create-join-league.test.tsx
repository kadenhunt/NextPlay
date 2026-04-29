import { cleanup, fireEvent, screen } from '@testing-library/react'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/dashboard/DashboardPage'
import {
  devResetMockDatabase,
  getLeagueById,
  listMyLeagues,
} from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_9', displayName: 'Creator User' },
  emailVerified: true,
  resendVerificationEmail: vi.fn(),
  markEmailVerifiedForDemo: vi.fn(),
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({ devMode: false }),
}))

describe('SYS-03 Create and join league flow', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
  })

  it('creates a league and lets a second user join by invite code', async () => {
    renderRoute(
      '/dashboard',
      '/dashboard',
      <DashboardPage />,
      [<Route key="league" path="/league/:id" element={<div>League route</div>} />],
    )

    expect(await screen.findByText('No leagues yet')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Create League' })[0]!)
    fireEvent.change(screen.getByLabelText('League name'), {
      target: { value: 'System Test League' },
    })
    fireEvent.change(screen.getByLabelText('Team count'), {
      target: { value: '6' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('League route')).toBeInTheDocument()

    const creatorLeagues = await listMyLeagues('user_9')
    const createdLeague = creatorLeagues.find((league) => league.name === 'System Test League')
    expect(createdLeague).toBeTruthy()

    const inviteCode = createdLeague!.inviteCode

    cleanup()

    authState.user = { id: 'user_8', displayName: 'Joiner User' }

    renderRoute(
      '/dashboard',
      '/dashboard',
      <DashboardPage />,
      [<Route key="league" path="/league/:id" element={<div>League route</div>} />],
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Join League' })[0]!)
    fireEvent.change(screen.getByLabelText('Invite code'), {
      target: { value: inviteCode },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Join' }))

    expect(await screen.findByText('League route')).toBeInTheDocument()

    const joinedLeague = await getLeagueById(createdLeague!.id, 'user_8')
    expect(joinedLeague.name).toBe('System Test League')
  })
})
