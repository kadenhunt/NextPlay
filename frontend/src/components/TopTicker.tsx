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
    return items.map((i) => i.label).join('   •   ')
  }, [tickerQuery.data])

  return (
    <div className="border-b border-white/10 bg-gradient-to-r from-black/70 via-slate-950/80 to-black/70">
      <div className="mx-auto flex w-full max-w-7xl items-center overflow-hidden px-6 py-2">
        <span className="mr-3 rounded-md border border-red-400/50 bg-red-600/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(239,68,68,0.25)]">
          Live
        </span>
        <span className="mr-3 hidden text-[11px] uppercase tracking-wide text-slate-400 sm:inline">
          League + NCAA Wire
        </span>
        <div className="ticker-wrap">
          <div className="ticker-track text-xs text-slate-300">
            <span>{text}</span>
            <span aria-hidden="true">{text}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

