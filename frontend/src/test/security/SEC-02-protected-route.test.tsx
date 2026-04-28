import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import RequireAuthRoute from '@/router/RequireAuthRoute'
import { renderWithQueryClient } from '@/test/testUtils'

const authState = {
  status: 'unauthenticated' as const,
  user: null as null | { id: string; displayName: string },
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

describe('SEC-02 Unauthorized access blocked', () => {
  it('redirects unauthenticated users to login', async () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RequireAuthRoute />}>
            <Route path="/dashboard" element={<div>Secret dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })
})
