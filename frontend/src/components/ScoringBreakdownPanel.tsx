import type { PlayerScoringBreakdown, ScoringLine } from '@/types/models'

function rateCell(line: ScoringLine) {
  if (line.yardsDivisor != null) {
    return (
      <span className="text-zinc-500 dark:text-zinc-500">
        ÷ {line.yardsDivisor} yds → × {line.pointsPerUnit} fp
      </span>
    )
  }
  return <span className="text-zinc-500 dark:text-zinc-500">× {line.pointsPerUnit} fp each</span>
}

function valueCell(line: ScoringLine) {
  if (line.yardsDivisor != null) {
    return (
      <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
        {line.quantity}&nbsp;yds
      </span>
    )
  }
  return (
    <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">{line.quantity}</span>
  )
}

export default function ScoringBreakdownPanel({
  breakdown,
  compact = false,
  showFootnote = true,
}: {
  breakdown: PlayerScoringBreakdown
  compact?: boolean
  /** Hide on nested / team page rows to avoid repeating mock vs FR copy. */
  showFootnote?: boolean
}) {
  const pad = compact ? 'px-2 py-1.5' : 'px-2.5 py-2'

  return (
    <div
      className={
        compact
          ? 'rounded-lg border border-zinc-200 bg-zinc-100/90 p-2.5 dark:border-zinc-800/90 dark:bg-zinc-950/40'
          : 'rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Point summary
        </h4>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
          {breakdown.isProjected ? 'Projected week' : 'Final scoring'}
        </span>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className={`w-full text-left text-xs ${compact ? '' : 'text-[13px]'}`}>
          <thead>
            <tr className="border-b border-zinc-200 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-500">
              <th className={`${pad} font-medium`}>Category</th>
              <th className={`${pad} font-medium`}>Value</th>
              <th className={`${pad} font-medium`}>Scoring</th>
              <th className={`${pad} text-right font-medium`}>Fp</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.lines.map((line, idx) => (
              <tr
                key={`${line.label}-${idx}`}
                className="border-b border-zinc-200/90 last:border-0 dark:border-zinc-800/40"
              >
                <td className={`${pad} font-medium text-zinc-800 dark:text-zinc-200`}>{line.label}</td>
                <td className={`${pad}`}>{valueCell(line)}</td>
                <td className={`${pad} min-w-[9rem]`}>{rateCell(line)}</td>
                <td className={`${pad} text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100`}>
                  {line.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`mt-2 flex justify-between border-t border-zinc-200 pt-2 font-semibold dark:border-zinc-800 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <span className="text-zinc-600 dark:text-zinc-400">Player fantasy total</span>
        <span className="font-mono text-red-600 tabular-nums dark:text-red-400">{breakdown.fantasyTotal}</span>
      </div>

      {showFootnote ? (
        <p className="mt-2 text-[10px] leading-snug text-zinc-600 dark:text-zinc-600">
          <span className="text-zinc-500 dark:text-zinc-500">Mock:</span> value × rate → Fp per row; total is the
          sum.
          <span className="text-zinc-500 dark:text-zinc-500"> FR:</span> same grid from your scoring engine +
          official stat feed; list &quot;projected&quot; stays in sync with this total.
        </p>
      ) : null}
    </div>
  )
}
