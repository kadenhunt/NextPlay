import { fireEvent, screen } from '@testing-library/react'
import { Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPage from '@/pages/auth/LoginPage'
import { renderRoute } from '@/test/testUtils'

import {
  measureAsyncStep,
  PERFORMANCE_THRESHOLDS_MS,
} from './performanceUtils'

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

describe('PERF-01 Login response time', () => {
  beforeEach(() => {
    authState.login.mockReset()
    authState.logout.mockReset()
    authState.logout.mockResolvedValue(undefined)
  })

  it('completes the MVP login success path within the threshold', async () => {
    authState.login.mockImplementation(
      () => new Promise<void>((resolve) => window.setTimeout(resolve, 120)),
    )

    renderRoute(
      '/login',
      '/login',
      <LoginPage />,
      [<Route key="dashboard" path="/dashboard" element={<div>Dashboard screen</div>} />],
    )

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    })

    await measureAsyncStep(
      'PERF-01 login success path',
      PERFORMANCE_THRESHOLDS_MS.login,
      async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
        expect(await screen.findByText('Dashboard screen')).toBeInTheDocument()
      },
    )
  })
})
