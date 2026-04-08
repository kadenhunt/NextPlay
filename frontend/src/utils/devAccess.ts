/**
 * Production: only emails listed in VITE_NEXTPLAY_DEV_OWNER_EMAILS (comma-separated, case-insensitive) may toggle Dev mode.
 * Development: anyone can use Dev mode so local workflows stay easy.
 */
function parseOwnerEmails(): Set<string> {
  const raw = import.meta.env.VITE_NEXTPLAY_DEV_OWNER_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

const ownerEmails = parseOwnerEmails()

export function canAccessDevModeToggle(userEmail: string | undefined): boolean {
  if (import.meta.env.DEV) return true
  if (!userEmail) return false
  return ownerEmails.has(userEmail.trim().toLowerCase())
}
