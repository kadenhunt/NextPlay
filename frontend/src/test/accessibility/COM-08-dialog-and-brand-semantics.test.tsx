import { fireEvent, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HeaderBrandLogo from '@/components/HeaderBrandLogo'
import PlayersPage from '@/pages/league/PlayersPage'
import { devResetMockDatabase, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute, renderWithQueryClient } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'dark' }),
}))

vi.mock('@/providers/AccessibilityProvider', () => ({
  useAccessibilityPrefs: () => ({
    prefs: { motion: 'system', contrast: 'default', textScale: '100' },
  }),
}))

const authState = {
  user: { id: 'user_1', displayName: 'Players User' },
}

let leagueContext: {
  league: Awaited<ReturnType<typeof getMockLeagueById>> | null
} = {
  league: null,
}

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => authState,
}))

vi.mock('@/providers/LeagueProvider', () => ({
  useLeague: () => leagueContext,
}))

describe('COM-08 Dialog and brand semantics', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('3', 'user_1')
  })

  it('renders an accessible brand link and modal dialog semantics', async () => {
    renderWithQueryClient(
      <MemoryRouter>
        <HeaderBrandLogo />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Go to NextPlay dashboard' })).toBeInTheDocument()

    renderRoute('/league/3/players', '/league/:id/players', <PlayersPage />)

    const table = await screen.findByRole('table')
    const firstRow = within(table).getAllByRole('row')[1]!
    fireEvent.click(within(firstRow).getByRole('button', { name: 'View' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText('Player Details')).toBeInTheDocument()
  })
})
