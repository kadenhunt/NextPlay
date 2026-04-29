import { fireEvent, screen } from '@testing-library/react'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RegisterPage from '@/pages/auth/RegisterPage'
import { renderRoute } from '@/test/testUtils'

const authState = {
  status: 'unauthenticated' as const,
  user: null,
  emailVerified: false,
  login: vi.fn(),
  logout: vi.fn<() => Promise<void>>(),
  register: vi.fn<(...args: [string, string, string]) => Promise<void>>(),
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

describe('SYS-01 Register to dashboard', () => {
  beforeEach(() => {
    authState.register.mockReset()
    authState.logout.mockReset()
    authState.logout.mockResolvedValue(undefined)
  })

  it('creates an account and lands on the dashboard route', async () => {
    authState.register.mockResolvedValue(undefined)

    renderRoute(
      '/register',
      '/register',
      <RegisterPage />,
      [<Route key="dashboard" path="/dashboard" element={<div>Dashboard shell</div>} />],
    )

    fireEvent.change(screen.getByLabelText(/Display name/i), {
      target: { value: 'System User' },
    })
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'system@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Choose a password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByText('Dashboard shell'),
    ).toBeInTheDocument()
    expect(authState.register).toHaveBeenCalledWith(
      'system@example.com',
      'Password123!',
      'System User',
    )
  })
})
