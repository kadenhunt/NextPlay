import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import RootLayout from '@/layouts/RootLayout'
import { renderWithQueryClient } from '@/test/testUtils'

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { id: 'user_1', email: 'user@example.com', displayName: 'Player One' },
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('@/providers/DevModeProvider', () => ({
  useDevMode: () => ({ devMode: false }),
}))

vi.mock('@/components/HeaderBrandLogo', () => ({
  default: () => <div>Brand</div>,
}))

vi.mock('@/components/ThemeToggle', () => ({
  default: () => <button type="button" aria-label="Switch theme">Theme</button>,
}))

vi.mock('@/components/TopTicker', () => ({
  default: () => <div role="status" aria-live="polite">Ticker updates</div>,
}))

describe('COM-02 Landmarks and skip link', () => {
  it('renders a skip link, main landmark, and status region', async () => {
    renderWithQueryClient(
      <MemoryRouter>
        <RootLayout>
          <div>Dashboard content</div>
        </RootLayout>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('status')).toHaveTextContent('Ticker updates')
  })
})
