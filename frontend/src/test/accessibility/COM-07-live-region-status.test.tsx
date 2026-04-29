import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import TopTicker from '@/components/TopTicker'
import { renderWithQueryClient } from '@/test/testUtils'

const getTopTickerItems = vi.fn()

vi.mock('@/providers/AccessibilityProvider', () => ({
  useAccessibilityPrefs: () => ({
    prefs: { motion: 'reduce', contrast: 'default', textScale: '100' },
  }),
}))

vi.mock('@/services/api/nextplayApi', () => ({
  getTopTickerItems: (...args: unknown[]) => getTopTickerItems(...args),
}))

describe('COM-07 Dynamic content status regions', () => {
  it('announces ticker updates through a live status region', async () => {
    getTopTickerItems.mockResolvedValue([
      { id: 'h1', label: 'Football projections updated.' },
      { id: 'h2', label: 'Baseball lineups posted.' },
    ])

    renderWithQueryClient(<TopTicker userId="user_1" />)

    await screen.findByText(/Football projections updated\./i)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent('Football projections updated.')
  })
})
