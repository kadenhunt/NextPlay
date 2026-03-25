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
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-slate-300">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-medium ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-600 dark:text-gray-400">
                Loading...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-4 text-center text-red-700 dark:text-red-200">
                {error}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-600 dark:text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-t border-white/5 hover:bg-white/5 transition"
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

