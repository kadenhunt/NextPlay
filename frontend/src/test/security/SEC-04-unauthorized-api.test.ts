import { beforeEach, describe, expect, it } from 'vitest'

import { devResetMockDatabase, getChatMessages } from '@/services/mocks/mockNextPlayApi'

describe('SEC-04 API endpoints require authentication', () => {
  beforeEach(async () => {
    window.localStorage?.clear?.()
    await devResetMockDatabase()
  })

  it('rejects a chat read for a user who is not a league member', async () => {
    await expect(getChatMessages('1', 'user_99')).rejects.toThrow('Not authorized')
  })
})
