import { useDevMode } from '@/providers/DevModeProvider'

export default function DevModeToggle() {
  const { devMode, toggleDevMode } = useDevMode()

  return (
    <button
      type="button"
      onClick={toggleDevMode}
      className="group inline-flex items-center gap-2.5 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium backdrop-blur transition-all hover:border-zinc-600 hover:bg-zinc-800/80"
      title="Dev mode: demo shortcuts and synthetic data fills (mock API is separate — see banner below)."
    >
      <span className={`transition-colors ${devMode ? 'text-red-400' : 'text-zinc-500'}`}>
        Dev
      </span>

      <div
        className={[
          'relative h-[18px] w-[34px] rounded-full transition-colors duration-200',
          devMode
            ? 'bg-red-500 shadow-[0_0_12px_rgba(128,30,36,0.5)]'
            : 'bg-zinc-700',
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
