import { screen } from '@testing-library/react'
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

describe('COM-03 Form labels', () => {
  beforeEach(() => {
    getChatMessages.mockReset()
    postChatMessage.mockReset()
  })

  it('associates the chat textarea with a visible label', async () => {
    getChatMessages.mockResolvedValue([])
    postChatMessage.mockResolvedValue([])

    renderRoute('/league/2/chat', '/league/:id/chat', <ChatPage />)

    expect(await screen.findByText('Chat')).toBeInTheDocument()
    expect(screen.getByLabelText('Send a message')).toBeInTheDocument()
  })
})
