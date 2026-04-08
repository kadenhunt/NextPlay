import { useDevMode } from '@/providers/DevModeProvider'

export default function DevModeToggle() {
  const { devMode, toggleDevMode } = useDevMode()

  return (
    <button
      type="button"
      onClick={toggleDevMode}
      className="group inline-flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      title="Dev mode toggle"
    >
      <span className={`transition-colors ${devMode ? 'text-red-600' : 'text-zinc-500'}`}>
        Dev
      </span>

      <div
        className={[
          'relative h-[18px] w-[34px] rounded-full transition-colors duration-200',
          devMode
            ? 'bg-red-500 shadow-[0_0_12px_rgba(128,30,36,0.5)]'
            : 'bg-zinc-300 dark:bg-zinc-600',
        ].join(' ')}
      >
        <div
          className={[
            'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200',
            devMode ? 'translate-x-[16px]' : 'translate-x-[2px]',
          ].join(' ')}
        />
      </div>
    </button>
  )
}
