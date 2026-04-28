import { fireEvent, screen } from '@testing-library/react'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/pages/dashboard/DashboardPage'
import { devResetMockDatabase } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_9', displayName: 'Regression User' },
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

describe('RT-02 League create regression', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
  })

  it('still creates a league from the dashboard flow', async () => {
    renderRoute(
      '/dashboard',
      '/dashboard',
      <DashboardPage />,
      [<Route key="league" path="/league/:id" element={<div>Created league route</div>} />],
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Create League' })[0]!)
    fireEvent.change(screen.getByLabelText('League name'), {
      target: { value: 'Regression League' },
    })
    fireEvent.change(screen.getByLabelText('Team count'), {
      target: { value: '6' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Created league route')).toBeInTheDocument()
  })
})
