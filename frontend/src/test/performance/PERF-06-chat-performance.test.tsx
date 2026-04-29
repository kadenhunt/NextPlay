import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ChatPage from '@/pages/league/ChatPage'
import { renderRoute } from '@/test/testUtils'

import {
  measureAsyncStep,
  PERFORMANCE_THRESHOLDS_MS,
} from './performanceUtils'

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

describe('PERF-06 Chat load and send time', () => {
  beforeEach(() => {
    getChatMessages.mockReset()
    postChatMessage.mockReset()
  })

  it('loads messages and sends a chat update within the MVP threshold', async () => {
    getChatMessages.mockImplementation(
      () =>
        new Promise((resolve) =>
          window.setTimeout(
            () =>
              resolve([
                {
                  id: 'msg_1',
                  leagueId: '2',
                  userId: 'user_2',
                  displayName: 'Hudson',
                  text: 'On the clock soon.',
                  createdAt: '2026-04-27T12:00:00.000Z',
                },
              ]),
            300,
          ),
        ),
    )

    postChatMessage.mockImplementation(
      () =>
        new Promise((resolve) =>
          window.setTimeout(
            () =>
              resolve([
                {
                  id: 'msg_2',
                  leagueId: '2',
                  userId: 'user_1',
                  displayName: 'Player One',
                  text: 'Performance test message',
                  createdAt: '2026-04-27T12:01:00.000Z',
                },
              ]),
            420,
          ),
        ),
    )

    renderRoute('/league/2/chat', '/league/:id/chat', <ChatPage />)

    await measureAsyncStep(
      'PERF-06 chat load',
      PERFORMANCE_THRESHOLDS_MS.chat,
      async () => {
        expect(await screen.findByText('Hudson')).toBeInTheDocument()
        expect(screen.getByText('On the clock soon.')).toBeInTheDocument()
      },
    )

    fireEvent.change(screen.getByLabelText('Send a message'), {
      target: { value: 'Performance test message' },
    })

    await measureAsyncStep(
      'PERF-06 chat send',
      PERFORMANCE_THRESHOLDS_MS.chat,
      async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Send' }))
        expect(await screen.findByText('Message sent.')).toBeInTheDocument()
      },
    )
  })
})
