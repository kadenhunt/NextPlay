import { expect } from 'vitest'

export const PERFORMANCE_THRESHOLDS_MS = {
  login: 1500,
  dashboard: 2500,
  draft: 3000,
  players: 4500,
  matchups: 3500,
  chat: 2500,
} as const

export async function measureAsyncStep<T>(
  label: string,
  thresholdMs: number,
  run: () => Promise<T>,
): Promise<T> {
  const start = performance.now()
  const result = await run()
  const elapsed = performance.now() - start

  console.info(
    `[performance] ${label}: ${elapsed.toFixed(1)}ms (threshold ${thresholdMs}ms)`,
  )
  expect(elapsed).toBeLessThan(thresholdMs)

  return result
}
