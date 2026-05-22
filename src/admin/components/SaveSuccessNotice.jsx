import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const AUTO_DISMISS_MS = 3000

/**
 * Centered success confirmation after a product save. Portal so it stays visible after modals close.
 * @param {{ open: boolean, message?: string, onDismiss: () => void }} props
 */
export function SaveSuccessNotice({ open, message = 'Successfully saved', onDismiss }) {
  useEffect(() => {
    if (!open) return undefined
    const timer = window.setTimeout(() => onDismiss(), AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [open, onDismiss])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-accent/40 bg-slate px-5 py-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
        role="alertdialog"
        aria-live="polite"
        aria-labelledby="save-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="save-success-title" className="text-center font-sans text-sm text-fog">
          {message}
        </p>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl bg-accent px-6 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-accent hover:brightness-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
