import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { useAuth } from '@/providers/AuthProvider'
import { useAccessibilityPrefs } from '@/providers/AccessibilityProvider'
import { useTheme, type Theme } from '@/providers/ThemeProvider'

const NOTIF_STORAGE_KEY = 'nextplay.user.notifications'

type NotificationPrefs = {
  matchupAlerts: boolean
  tradeUpdates: boolean
  leagueNews: boolean
}

function readNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY)
    if (!raw) {
      return { matchupAlerts: true, tradeUpdates: true, leagueNews: true }
    }
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>
    return {
      matchupAlerts: parsed.matchupAlerts ?? true,
      tradeUpdates: parsed.tradeUpdates ?? true,
      leagueNews: parsed.leagueNews ?? true,
    }
  } catch {
    return { matchupAlerts: true, tradeUpdates: true, leagueNews: true }
  }
}

const cardClass =
  'rounded-xl border border-zinc-300 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none'

export default function AccountSettingsPage() {
  const { user, updateProfile } = useAuth()
  const { prefs, setContrast, setMotion, setTextScale } = useAccessibilityPrefs()
  const { theme, setTheme } = useTheme()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [profileErr, setProfileErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [notif, setNotif] = useState<NotificationPrefs>(() => readNotificationPrefs())

  useEffect(() => {
    setDisplayName(user?.displayName ?? '')
  }, [user?.displayName])

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notif))
    } catch {
      /* noop */
    }
  }, [notif])

  const onProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileErr(null)
    setSaving(true)
    try {
      await updateProfile(displayName)
      setProfileMsg('Profile saved.')
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <h1 className="font-display text-xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
          Account settings
        </h1>
        <p className="mt-1 max-w-[70ch] text-sm text-zinc-600 dark:text-zinc-400">
          Manage your profile, notification preferences, and accessibility settings.
        </p>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-base font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Dark is the default. Switch to light if you prefer a brighter background in the header and main areas.
        </p>
        <label className="mt-4 block space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Theme</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="w-full max-w-xs rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="dark">Dark (default)</option>
            <option value="light">Light</option>
          </select>
        </label>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-base font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
          Profile
        </h2>
        <form className="mt-4 space-y-4" onSubmit={onProfileSubmit}>
          <Input
            label="Display name"
            id="profile-display-name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            labelClassName="text-zinc-800 dark:text-zinc-200"
            className="border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <Input
            label="Email"
            id="profile-email"
            value={user?.email ?? ''}
            disabled
            hint="Email updates will be available after backend auth integration."
            labelClassName="text-zinc-800 dark:text-zinc-200"
            className="border-zinc-300 bg-zinc-50 text-zinc-600 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400"
          />
          {profileErr ? <p className="text-sm text-red-600" role="alert">{profileErr}</p> : null}
          {profileMsg ? <p className="text-sm text-emerald-700" role="status">{profileMsg}</p> : null}
          <Button type="submit" isLoading={saving}>
            Save profile
          </Button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-base font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
          Notifications
        </h2>
        <div className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notif.matchupAlerts} onChange={(e) => setNotif((p) => ({ ...p, matchupAlerts: e.target.checked }))} />
            Matchup alerts
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notif.tradeUpdates} onChange={(e) => setNotif((p) => ({ ...p, tradeUpdates: e.target.checked }))} />
            Trade updates
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notif.leagueNews} onChange={(e) => setNotif((p) => ({ ...p, leagueNews: e.target.checked }))} />
            League news
          </label>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-base font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
          Accessibility
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Motion</span>
            <select
              value={prefs.motion}
              onChange={(e) => setMotion(e.target.value as typeof prefs.motion)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="system">Follow system</option>
              <option value="reduce">Reduce motion</option>
              <option value="no-preference">Allow motion</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Contrast</span>
            <select
              value={prefs.contrast}
              onChange={(e) => setContrast(e.target.value as typeof prefs.contrast)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="default">Standard</option>
              <option value="high">High contrast</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Text size</span>
            <select
              value={prefs.textScale}
              onChange={(e) => setTextScale(e.target.value as typeof prefs.textScale)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="100">Default</option>
              <option value="110">Larger text</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  )
}
