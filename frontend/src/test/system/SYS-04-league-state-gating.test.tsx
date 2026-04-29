import type { PropsWithChildren } from 'react'
import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import LeagueLayout from '@/layouts/LeagueLayout'
import { renderWithQueryClient } from '@/test/testUtils'

const leagueContext = {
  status: 'ready' as const,
  error: null,
  userRole: 'MEMBER' as const,
  league: {
    id: '1',
    name: 'Saturday Lights: East Division',
    sport: 'football',
    state: 'CREATED',
    inviteCode: 'PLAY123',
    members: [
      { userId: 'user_1', displayName: 'Player One', role: 'MEMBER' },
      { userId: 'user_2', displayName: 'Player Two', role: 'COMMISSIONER' },
    ],
  },
  isCommissioner: false,
  leagueId: '1',
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user_1', email: 'user@example.com', displayName: 'Player One' },
  }),
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({
    devMode: false,
  }),
}))

vi.mock('@/providers/LeagueProvider', () => ({
  __esModule: true,
  default: ({ children }: PropsWithChildren) => <>{children}</>,
  useLeague: () => leagueContext,
}))

describe('SYS-04 League state gating', () => {
  it('shows locked tabs when the league state does not allow access', async () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={['/league/1/overview']}>
        <Routes>
          <Route path="/league/:id" element={<LeagueLayout />}>
            <Route path="overview" element={<div>Overview content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Overview content')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'League sections' })).toBeInTheDocument()
    expect(screen.getByText('Draft · Locked')).toBeInTheDocument()
    expect(screen.getByText('Players · Locked')).toBeInTheDocument()
    expect(screen.getByText('Matchups · Locked')).toBeInTheDocument()
    expect(screen.getByText('Standings · Locked')).toBeInTheDocument()
    expect(screen.getByText('Settings · Locked')).toBeInTheDocument()
  })
})
