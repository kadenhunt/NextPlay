import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { getTopTickerItems, listMyLeagues } from '@/services/api/nextplayApi'
import Button from '@/components/Button'

type FeedTab = 'global' | 'league'

export default function NotificationsPage() {
  const { user } = useAuth()
  const userId = user?.id
  const [tab, setTab] = useState<FeedTab>('league')

  const globalFeedQuery = useQuery({
    queryKey: ['notificationsGlobal'],
    queryFn: () => getTopTickerItems(),
  })

  const leagueFeedQuery = useQuery({
    queryKey: ['notificationsLeague', userId],
    queryFn: () => getTopTickerItems(userId),
    enabled: Boolean(userId),
  })

  const leaguesQuery = useQuery({
    queryKey: ['myLeagues', userId],
    queryFn: () => listMyLeagues(userId!),
    enabled: Boolean(userId),
  })

  const leagueNames = useMemo(() => new Set((leaguesQuery.data ?? []).map((l) => l.name)), [leaguesQuery.data])

  const leagueItems = useMemo(
    () =>
      (leagueFeedQuery.data ?? []).filter((item) =>
        Array.from(leagueNames).some((name) => item.label.includes(name)),
      ),
    [leagueFeedQuery.data, leagueNames],
  )

  const currentItems = tab === 'global' ? globalFeedQuery.data ?? [] : leagueItems
  const updatedAt =
    tab === 'global' ? globalFeedQuery.dataUpdatedAt : leagueFeedQuery.dataUpdatedAt

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-300 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none">
        <h1 className="font-display text-xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
          Notification Center
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Track global college sports updates and league-specific events.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant={tab === 'league' ? 'primary' : 'secondary'} onClick={() => setTab('league')}>
            League feed
          </Button>
          <Button variant={tab === 'global' ? 'primary' : 'secondary'} onClick={() => setTab('global')}>
            Global feed
          </Button>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          Last updated:{' '}
          {updatedAt ? new Date(updatedAt).toLocaleString() : 'Loading...'}
        </p>
      </section>

      <section className="rounded-xl border border-zinc-300 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none">
        {currentItems.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {tab === 'league'
              ? 'No league-specific items yet. Join a league or check back soon.'
              : 'No global updates available.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {currentItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300"
              >
                <span aria-hidden="true" className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
