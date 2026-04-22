import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

/**
 * Inline failure state for a single section (catalog block, hero form, etc.).
 * Does not replace the whole page — only the area that depends on the failed request.
 */
export function ApiSectionError({
  title = 'This section failed to load',
  message,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-flare/35 bg-ink/90 px-5 py-6 text-center shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)] backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-flare/30 bg-flare/10 text-flare">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-fog">{title}</p>
          {message ? (
            <p className="mt-2 font-sans text-sm leading-relaxed text-mist">{message}</p>
          ) : null}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-mist/90">
            If the problem continues, reload the page and ensure Spring Boot is running on port 8080.
          </p>
        </div>
        {typeof onRetry === 'function' ? (
          <Button type="button" variant="primary" size="md" className="mt-1 gap-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
