import { fireEvent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RootLayout from '@/layouts/RootLayout'
import { renderWithQueryClient } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  status: 'authenticated' as const,
  user: { id: 'user_1', email: 'user@example.com', displayName: 'System User' },
  logout: vi.fn<() => Promise<void>>(),
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({ devMode: false }),
}))

vi.mock('@/components/TopTicker', () => ({
  default: () => <div>Top ticker</div>,
}))

vi.mock('@/components/HeaderBrandLogo', () => ({
  default: () => <div>NextPlay</div>,
}))

vi.mock('@/components/ThemeToggle', () => ({
  default: () => <button type="button">Theme</button>,
}))

describe('SYS-02 Logout flow', () => {
  beforeEach(() => {
    authState.logout.mockReset()
    authState.logout.mockResolvedValue(undefined)
  })

  it('logs out from the app shell and navigates to login', async () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route path="dashboard" element={<div>Dashboard page</div>} />
          </Route>
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(authState.logout).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByText('Login screen')).toBeInTheDocument()
  })
})
