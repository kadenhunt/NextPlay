import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  title?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  /** e.g. max-w-4xl for wide content */
  panelClassName?: string
}

export default function Modal({ open, title, children, footer, onClose, panelClassName }: Props) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onMouseDown={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 w-full rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-900/15 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/50 ${panelClassName ?? 'max-w-lg'}`}
      >
        {title ? <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2> : null}
        <div className="mt-3">{children}</div>
        {footer ? <div className="mt-5">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
