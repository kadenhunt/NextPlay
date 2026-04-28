import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ChatPage from '@/pages/league/ChatPage'
import { renderRoute } from '@/test/testUtils'

const getChatMessages = vi.fn()
const postChatMessage = vi.fn()

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user_1', email: 'user@example.com', displayName: 'Player One' },
  }),
}))

vi.mock('@/providers/LeagueProvider', () => ({
  useLeague: () => ({
    league: { id: '2', state: 'DRAFT_IN_PROGRESS' },
  }),
}))

vi.mock('@/services/api/nextplayApi', () => ({
  getChatMessages: (...args: unknown[]) => getChatMessages(...args),
  postChatMessage: (...args: unknown[]) => postChatMessage(...args),
}))

describe('U-04 Chat Page', () => {
  beforeEach(() => {
    getChatMessages.mockReset()
    postChatMessage.mockReset()
  })

  it('renders messages and sends a new one', async () => {
    getChatMessages.mockResolvedValue([
      {
        id: 'msg_1',
        leagueId: '2',
        userId: 'user_2',
        displayName: 'Hudson',
        text: 'On the clock soon.',
        createdAt: '2026-04-27T12:00:00.000Z',
      },
    ])
    postChatMessage.mockResolvedValue([])

    renderRoute('/league/2/chat', '/league/:id/chat', <ChatPage />)

    expect(await screen.findByText('Hudson')).toBeInTheDocument()
    expect(screen.getByText('On the clock soon.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Send a message'), {
      target: { value: 'Hello league' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(postChatMessage).toHaveBeenCalledWith('2', 'user_1', 'Hello league')
    })
    expect(await screen.findByText('Message sent.')).toBeInTheDocument()
  })
})
