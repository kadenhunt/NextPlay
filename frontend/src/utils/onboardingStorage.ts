/** Persist Getting Started checklist progress per user (mock auth uses stable ids). */

export function onboardingStorageKey(userId: string) {
  return `nextplay.onboarding.${userId}`
}

export function markOnboardingOpenedLeague(userId: string) {
  const key = onboardingStorageKey(userId)
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? (JSON.parse(raw) as { checks?: Record<string, boolean>; dismissed?: boolean }) : {}
    const checks = { ...(parsed.checks ?? {}), openedLeague: true }
    localStorage.setItem(
      key,
      JSON.stringify({
        checks,
        dismissed: Boolean(parsed.dismissed),
      }),
    )
  } catch {
    /* noop */
  }
}

export function readOnboardingSnapshot(userId: string): {
  checks: Record<string, boolean>
  dismissed: boolean
} | null {
  const key = onboardingStorageKey(userId)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { checks?: Record<string, boolean>; dismissed?: boolean }
    return {
      checks: parsed.checks ?? {},
      dismissed: Boolean(parsed.dismissed),
    }
  } catch {
    return null
  }
}
