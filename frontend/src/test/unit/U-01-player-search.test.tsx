import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import PlayerSearchBar from '@/components/PlayerSearchBar'

describe('U-01 PlayerSearch component', () => {
  it('adapts its labels and forwards search input for each sport state', () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()

    const { rerender } = render(
      <PlayerSearchBar sport="football" value="" onChange={onChange} onSubmit={onSubmit} />,
    )

    expect(screen.getByRole('search', { name: 'Search football players' })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search football players'), {
      target: { value: 'Williams' },
    })
    fireEvent.submit(screen.getByRole('search'))

    expect(onChange).toHaveBeenCalledWith('Williams')
    expect(onSubmit).toHaveBeenCalledTimes(1)

    rerender(<PlayerSearchBar sport="basketball" value="" onChange={onChange} />)
    expect(screen.getByRole('search', { name: 'Search basketball players' })).toBeInTheDocument()

    rerender(<PlayerSearchBar sport="baseball" value="" onChange={onChange} isLoading />)
    expect(screen.getByRole('search', { name: 'Search baseball players' })).toBeInTheDocument()
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })
})
