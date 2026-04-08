import type { LeagueState } from '@/types/models'
import { LeagueState as LeagueStateValues } from '@/types/models'

type Props = {
  state: LeagueState
}

const stateToStyles: Record<LeagueState, string> = {
  [LeagueStateValues.CREATED]:
    'border-zinc-300 bg-zinc-200 text-zinc-800 dark:border-zinc-700/60 dark:bg-zinc-800/80 dark:text-zinc-300',
  [LeagueStateValues.DRAFT_SCHEDULED]:
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [LeagueStateValues.DRAFT_IN_PROGRESS]:
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [LeagueStateValues.SEASON_ACTIVE]:
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [LeagueStateValues.PLAYOFFS]:
    'bg-red-500/10 text-red-400 border-red-500/20',
  [LeagueStateValues.COMPLETE]:
    'border-zinc-300 bg-zinc-200 text-zinc-700 dark:border-zinc-700/40 dark:bg-zinc-800/60 dark:text-zinc-400',
}

const liveStates = new Set<LeagueState>([
  LeagueStateValues.DRAFT_IN_PROGRESS,
  LeagueStateValues.SEASON_ACTIVE,
  LeagueStateValues.PLAYOFFS,
])

const dotColor: Partial<Record<LeagueState, string>> = {
  [LeagueStateValues.DRAFT_IN_PROGRESS]: 'bg-emerald-400',
  [LeagueStateValues.SEASON_ACTIVE]: 'bg-blue-400',
  [LeagueStateValues.PLAYOFFS]: 'bg-red-400',
}

function prettyLabel(state: LeagueState) {
  switch (state) {
    case LeagueStateValues.CREATED:
      return 'Created'
    case LeagueStateValues.DRAFT_SCHEDULED:
      return 'Draft Scheduled'
    case LeagueStateValues.DRAFT_IN_PROGRESS:
      return 'Draft Live'
    case LeagueStateValues.SEASON_ACTIVE:
      return 'Season Active'
    case LeagueStateValues.PLAYOFFS:
      return 'Playoffs'
    case LeagueStateValues.COMPLETE:
      return 'Complete'
    default: {
      const _exhaustive: never = state
      return _exhaustive
    }
  }
}

export default function StatusBadge({ state }: Props) {
  const isLive = liveStates.has(state)
  const dot = dotColor[state]

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        stateToStyles[state],
      ].join(' ')}
    >
      {isLive && dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dot}`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
        </span>
      )}
      {prettyLabel(state)}
    </span>
  )
}
