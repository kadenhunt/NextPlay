import { fireEvent, screen } from '@testing-library/react'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/dashboard/DashboardPage'
import { devResetMockDatabase } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Existing Member' },
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

describe('RT-03 Join league regression', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
  })

  it('still joins a seeded league by invite code', async () => {
    renderRoute(
      '/dashboard',
      '/dashboard',
      <DashboardPage />,
      [<Route key="league" path="/league/:id" element={<div>Joined league route</div>} />],
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Join League' })[0]!)
    fireEvent.change(screen.getByLabelText('Invite code'), {
      target: { value: 'PLAY123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Join' }))

    expect(await screen.findByText('Joined league route')).toBeInTheDocument()
  })
})
