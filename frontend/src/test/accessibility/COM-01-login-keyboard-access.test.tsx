import { fireEvent, screen } from '@testing-library/react'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPage from '@/pages/auth/LoginPage'
import { renderRoute } from '@/test/testUtils'

const authState = {
  status: 'unauthenticated' as const,
  user: null,
  emailVerified: false,
  login: vi.fn(),
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

describe('COM-01 Keyboard-only navigation', () => {
  beforeEach(() => {
    authState.logout.mockReset()
    authState.logout.mockResolvedValue(undefined)
  })

  it('keeps primary login controls keyboard-focusable', async () => {
    renderRoute(
      '/login',
      '/login',
      <LoginPage />,
      [<Route key="dashboard" path="/dashboard" element={<div>Dashboard</div>} />],
    )

    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByPlaceholderText('Enter your password')
    const submit = screen.getByRole('button', { name: 'Sign in' })
    const forgotPassword = screen.getByRole('link', { name: 'Forgot your password?' })

    email.focus()
    expect(email).toHaveFocus()

    password.focus()
    expect(password).toHaveFocus()

    fireEvent.change(email, { target: { value: 'user@example.com' } })
    fireEvent.change(password, { target: { value: 'password123' } })

    submit.focus()
    expect(submit).toHaveFocus()

    forgotPassword.focus()
    expect(forgotPassword).toHaveFocus()
  })
})
