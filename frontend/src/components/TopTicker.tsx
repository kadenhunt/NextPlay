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
    <div className="border-b border-zinc-800/60 bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl items-center overflow-hidden px-6 py-1.5">
        <span className="mr-3 flex items-center gap-1.5 rounded-md bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_16px_rgba(128,30,36,0.4)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          Live
        </span>
        <div className="ticker-wrap">
          <div className="ticker-track text-xs text-zinc-500">
            <span>{text}</span>
            <span aria-hidden="true">{text}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
