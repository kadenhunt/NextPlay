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
  user: { id: 'user_9', displayName: 'Workflow Creator' },
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

describe('WF-01 Create league, join league, and view dashboard', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    authState.user = { id: 'user_9', displayName: 'Workflow Creator' }
  })

  it('creates a league, joins it from a second user, and shows it on the dashboard', async () => {
    renderRoute(
      '/dashboard',
      '/dashboard',
      <DashboardPage />,
      [<Route key="league" path="/league/:id" element={<div>League route</div>} />],
    )

    expect(await screen.findByText('No leagues yet')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Create League' })[0]!)
    fireEvent.change(screen.getByLabelText('League name'), {
      target: { value: 'UAT Flow League' },
    })
    fireEvent.change(screen.getByLabelText('Team count'), {
      target: { value: '6' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('League route')).toBeInTheDocument()

    const creatorLeagues = await listMyLeagues('user_9')
    const createdLeague = creatorLeagues.find((league) => league.name === 'UAT Flow League')
    expect(createdLeague).toBeTruthy()

    cleanup()

    authState.user = { id: 'user_8', displayName: 'Workflow Joiner' }

    renderRoute(
      '/dashboard',
      '/dashboard',
      <DashboardPage />,
      [<Route key="league" path="/league/:id" element={<div>League route</div>} />],
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Join League' })[0]!)
    fireEvent.change(screen.getByLabelText('Invite code'), {
      target: { value: createdLeague!.inviteCode },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Join' }))

    expect(await screen.findByText('League route')).toBeInTheDocument()

    cleanup()

    renderRoute('/dashboard', '/dashboard', <DashboardPage />)

    expect(await screen.findByText('UAT Flow League')).toBeInTheDocument()

    const joinedLeague = await getLeagueById(createdLeague!.id, 'user_8')
    expect(joinedLeague.name).toBe('UAT Flow League')
  })
})
