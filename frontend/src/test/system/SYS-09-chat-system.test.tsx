import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ChatPage from '@/pages/league/ChatPage'
import { devResetMockDatabase, getChatMessages, getLeagueById as getMockLeagueById } from '@/services/mocks/mockNextPlayApi'
import { renderRoute } from '@/test/testUtils'

vi.mock('@/services/api/nextplayApi', async () => import('@/services/mocks/mockNextPlayApi'))

const authState = {
  user: { id: 'user_1', displayName: 'Chat User' },
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

describe('SYS-09 Chat flow', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
    leagueContext.league = await getMockLeagueById('2', 'user_1')
  })

  it('loads league chat and posts a message', async () => {
    renderRoute('/league/2/chat', '/league/:id/chat', <ChatPage />)

    expect(await screen.findByText('Chat')).toBeInTheDocument()
    expect(await screen.findByText('Welcome to NextPlay!')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Send a message'), {
      target: { value: 'System chat test message' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(async () => {
      const messages = await getChatMessages('2', 'user_1')
      expect(messages.some((message) => message.text === 'System chat test message')).toBe(true)
    })
  })
})
