import type { ReactNode } from 'react'

type Column<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
}

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  isLoading?: boolean
  error?: string | null
  emptyText?: string
  getRowId: (row: T) => string
}

export default function Table<T>({
  columns,
  rows,
  isLoading = false,
  error,
  emptyText = 'No results.',
  getRowId,
}: Props<T>) {
  return (
    <div className="overflow-x-auto np-card">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-100/90 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2.5 font-medium ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-500"
              >
                Loading...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-4 text-center text-red-400">
                {error}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-500"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-t border-zinc-200 transition hover:bg-zinc-100/80 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-3 align-top ${c.className ?? ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
