import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTopTickerItems } from '@/services/api/nextplayApi'

type Props = {
  userId?: string
}

export default function TopTicker({ userId }: Props) {
  const tickerQuery = useQuery({
    queryKey: ['topTicker', userId],
    queryFn: () => getTopTickerItems(userId),
    refetchInterval: 30_000,
  })

  const text = useMemo(() => {
    const items = tickerQuery.data ?? []
    if (!items.length) return 'Loading live league and college sports updates...'
    return items.map((i) => i.label).join('   \u2022   ')
  }, [tickerQuery.data])

  return (
    <div className="border-b border-zinc-200/90 bg-gradient-to-r from-white via-zinc-50 to-white dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto flex w-full max-w-[1600px] items-center overflow-hidden px-6 py-1.5">
        <span className="font-display mr-3 flex shrink-0 items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm shadow-red-900/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          Live
        </span>
        <div className="ticker-wrap min-w-0 flex-1" role="status" aria-live="polite" aria-atomic="true">
          <div className="ticker-track text-[13px] font-medium leading-snug text-zinc-600 dark:text-zinc-400">
            <span>{text}</span>
            <span aria-hidden="true">{text}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
