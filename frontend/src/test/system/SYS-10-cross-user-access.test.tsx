import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import LeagueLayout from '@/layouts/LeagueLayout'
import { devResetMockDatabase } from '@/services/mocks/mockNextPlayApi'
import { renderWithQueryClient } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_9', displayName: 'Outside User' },
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({ devMode: false }),
}))

describe('SYS-10 Cross-user access isolation', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
  })

  it('blocks a user who is not a member from loading another league', async () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={['/league/1/overview']}>
        <Routes>
          <Route path="/league/:id" element={<LeagueLayout />}>
            <Route path="overview" element={<div>Overview content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/not authorized/i)).toBeInTheDocument()
    expect(screen.queryByText('Overview content')).not.toBeInTheDocument()
  })
})
