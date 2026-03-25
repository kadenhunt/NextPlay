import type { LeagueState } from '@/types/models'
import { LeagueState as LeagueStateValues } from '@/types/models'

type Props = {
  state: LeagueState
}

const stateToStyles: Record<LeagueState, string> = {
  [LeagueStateValues.CREATED]:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-700',
  [LeagueStateValues.DRAFT_SCHEDULED]:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-900/40',
  [LeagueStateValues.DRAFT_IN_PROGRESS]:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-900/40',
  [LeagueStateValues.SEASON_ACTIVE]:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-900/40',
  [LeagueStateValues.PLAYOFFS]:
    'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-900/30',
  [LeagueStateValues.COMPLETE]:
    'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700',
}

function prettyLabel(state: LeagueState) {
  switch (state) {
    case LeagueStateValues.CREATED:
      return 'Created'
    case LeagueStateValues.DRAFT_SCHEDULED:
      return 'Draft Scheduled'
    case LeagueStateValues.DRAFT_IN_PROGRESS:
      return 'Draft In Progress'
    case LeagueStateValues.SEASON_ACTIVE:
      return 'Season Active'
    case LeagueStateValues.PLAYOFFS:
      return 'Playoffs'
    case LeagueStateValues.COMPLETE:
      return 'Complete'
    default: {
      // Exhaustiveness check.
      const _exhaustive: never = state
      return _exhaustive
    }
  }
}

export default function StatusBadge({ state }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
        stateToStyles[state],
      ].join(' ')}
    >
      {prettyLabel(state)}
    </span>
  )
}

