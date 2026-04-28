import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPage from '@/pages/auth/LoginPage'
import { renderRoute } from '@/test/testUtils'

const authState = {
  status: 'unauthenticated' as const,
  user: null,
  emailVerified: false,
  login: vi.fn<(...args: [string, string]) => Promise<void>>(),
  logout: vi.fn<() => Promise<void>>(),
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
  updateProfile: vi.fn(),
  resendVerificationEmail: vi.fn(),
  markEmailVerifiedForDemo: vi.fn(),
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('@/components/HeaderBrandLogo', () => ({
  default: () => <div>NextPlay</div>,
}))

describe('RT-01 Login regression', () => {
  beforeEach(() => {
    authState.login.mockReset()
    authState.logout.mockReset()
    authState.logout.mockResolvedValue(undefined)
  })

  it('still signs in and navigates to the dashboard route', async () => {
    authState.login.mockResolvedValue(undefined)

    renderRoute(
      '/login',
      '/login',
      <LoginPage />,
      [<Route key="dashboard" path="/dashboard" element={<div>Dashboard destination</div>} />],
    )

    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(authState.login).toHaveBeenCalledWith('user@example.com', 'password123')
    })
    expect(await screen.findByText('Dashboard destination')).toBeInTheDocument()
  })
})
