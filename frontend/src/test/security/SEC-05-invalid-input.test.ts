import { beforeEach, describe, expect, it } from 'vitest'

import {
  devResetMockDatabase,
  joinLeagueByInviteCode,
  postChatMessage,
} from '@/services/mocks/mockNextPlayApi'

describe('SEC-05 Invalid input handled safely', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
  })

  it('rejects invalid invite codes with a controlled error', async () => {
    await expect(joinLeagueByInviteCode('BADCODE', 'user_1')).rejects.toThrow('Invalid invite code')
  })

  it('rejects empty chat messages with a controlled error', async () => {
    await expect(postChatMessage('1', 'user_1', '   ')).rejects.toThrow('Message cannot be empty')
  })
})
