import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ScoringBreakdownPanel from '@/components/ScoringBreakdownPanel'
import type { PlayerScoringBreakdown } from '@/types/models'

const breakdown: PlayerScoringBreakdown = {
  fantasyTotal: 28.5,
  isProjected: false,
  lines: [
    { label: 'Passing TD', quantity: 3, pointsPerUnit: 4, points: 12 },
    { label: 'Passing Yards', quantity: 265, pointsPerUnit: 1, yardsDivisor: 25, points: 10.5 },
    { label: 'Rushing TD', quantity: 1, pointsPerUnit: 6, points: 6 },
  ],
}

describe('U-02 ScoringBreakdown component', () => {
  it('renders stat lines and totals for scoring display', () => {
    render(<ScoringBreakdownPanel breakdown={breakdown} />)

    expect(screen.getByText('Point summary')).toBeInTheDocument()
    expect(screen.getByText('Passing TD')).toBeInTheDocument()
    expect(screen.getByText('Passing Yards')).toBeInTheDocument()
    expect(screen.getByText('Rushing TD')).toBeInTheDocument()
    expect(screen.getByText('Player fantasy total')).toBeInTheDocument()
    expect(screen.getByText('28.5')).toBeInTheDocument()
    expect(screen.getByText('Final scoring')).toBeInTheDocument()
  })
})
