import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/dashboard/DashboardPage'
import { devResetMockDatabase } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_9', displayName: 'QA User' },
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

describe('L-01 Dashboard create/join flow', () => {
  beforeEach(async () => {
    localStorage.clear()
    await devResetMockDatabase()
    authState.user = { id: 'user_9', displayName: 'QA User' }
    authState.resendVerificationEmail.mockReset()
    authState.markEmailVerifiedForDemo.mockReset()
  })

  it('creates a league from the dashboard flow', async () => {
    renderRoute(
      '/dashboard',
      '/dashboard',
      <DashboardPage />,
      [<Route key="league" path="/league/:id" element={<div>League route</div>} />],
    )

    expect(await screen.findByText('No leagues yet')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Create League' })[0]!)

    expect(
      await screen.findByRole('heading', { name: 'Create League' }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('League name'), {
      target: { value: 'QA Integration League' },
    })
    fireEvent.change(screen.getByLabelText('Team count'), {
      target: { value: '6' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('League route')).toBeInTheDocument()
  })

  it('joins a seeded league by invite code', async () => {
    authState.user = { id: 'user_1', displayName: 'Existing Member' }

    renderRoute(
      '/dashboard',
      '/dashboard',
      <DashboardPage />,
      [<Route key="league" path="/league/:id" element={<div>Joined league route</div>} />],
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Join League' })[0]!)

    expect(
      await screen.findByRole('heading', { name: 'Join League' }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Invite code'), {
      target: { value: 'PLAY123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Join' }))

    expect(await screen.findByText('Joined league route')).toBeInTheDocument()
  })
})
