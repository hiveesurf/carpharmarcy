import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { augmentPart, formatInr, getPartById, getPartImage, getSuggestedParts } from '../../data/partsCatalog'
import { SafeImg } from '../ui/SafeImg'
import { ApiSectionError } from '../ui/ApiSectionError'
import { PartDetailContent } from './PartDetailContent.jsx'

/**
 * @param {string} [remoteLoadState] - When set (API mode): 'loading' | 'error' | 'ready'
 */
export function PartDetailOverlay({
  partId,
  resolvedPart,
  remoteLoadState,
  remoteErrorMessage,
  onRetryRemote,
  onClose,
  onOpenPart,
}) {
  const raw = resolvedPart ?? (partId ? getPartById(partId) : null)
  const part = raw ? augmentPart(raw) : null

  const scrollLocked =
    Boolean(partId) &&
    (remoteLoadState === 'loading' ||
      remoteLoadState === 'error' ||
      Boolean(part && (remoteLoadState === 'ready' || remoteLoadState == null)))

  useEffect(() => {
    if (!scrollLocked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [scrollLocked])

  useEffect(() => {
    if (!partId) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [partId, onClose])

  const catalogRef = raw && getPartById(raw.id) ? getPartById(raw.id) : null
  const suggestions = useMemo(
    () => (part && catalogRef ? getSuggestedParts(catalogRef, 4) : []),
    [part, catalogRef],
  )

  const backBtn = (
    <button
      type="button"
      onClick={onClose}
      className="clip-chamfer-sm flex items-center gap-2 border border-fog/15 bg-steel/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-fog transition-colors hover:border-accent/40 hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      Back
    </button>
  )

  return (
    <AnimatePresence>
      {partId && remoteLoadState === 'loading' && (
        <motion.div
          key={`${partId}-loading`}
          className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label="Loading product"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-fog/10 px-4 py-4 sm:px-6">
            {backBtn}
            <p className="font-mono text-xs text-mist">Loading product…</p>
          </header>
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="font-sans text-sm text-mist">Fetching details from the server.</p>
          </div>
        </motion.div>
      )}

      {partId && remoteLoadState === 'error' && (
        <motion.div
          key={`${partId}-error`}
          className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="part-detail-error-title"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-fog/10 px-4 py-4 sm:px-6">
            {backBtn}
            <h1 id="part-detail-error-title" className="font-display text-sm font-bold uppercase text-fog">
              Product detail
            </h1>
          </header>
          <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
            <ApiSectionError
              title="Could not load this product"
              message={remoteErrorMessage}
              onRetry={onRetryRemote}
              className="max-w-md"
            />
          </div>
        </motion.div>
      )}

      {partId && part && (remoteLoadState == null || remoteLoadState === 'ready') && (
        <motion.div
          key={partId}
          className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="part-detail-title"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-fog/10 px-4 py-3 sm:px-6">
            {backBtn}
            <p className="font-mono text-[10px] uppercase tracking-wider text-mist">Product details</p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6">
            <h1 id="part-detail-title" className="sr-only">
              {part.name}
            </h1>
            <PartDetailContent part={part} showKeepBrowsing onKeepBrowsing={onClose} />

            {suggestions.length > 0 ? (
              <section className="mx-auto mt-14 max-w-7xl border-t border-fog/10 pt-12 lg:mt-16">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">You might also need</p>
                <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-wide text-fog">
                  Related parts
                </h2>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {suggestions.map((s) => {
                    const img = getPartImage(s.imageKey)
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => onOpenPart(s.id)}
                          className="group flex w-full flex-col overflow-hidden rounded-md border border-fog/10 bg-gradient-to-b from-steel/30 to-graphite/20 text-left transition-colors hover:border-accent/40"
                        >
                          <div className="relative aspect-[5/3] overflow-hidden">
                            <SafeImg
                              src={img.src}
                              alt={img.alt}
                              fw={480}
                              fh={288}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              width={480}
                              height={288}
                              loading="lazy"
                            />
                            <span className="part-card-category-pill absolute left-2 top-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider">
                              {s.category}
                            </span>
                          </div>
                          <div className="p-4">
                            <p className="font-mono text-[9px] uppercase tracking-wider text-mist">{s.sku}</p>
                            <p className="mt-1 font-display text-sm font-bold uppercase leading-snug text-fog">
                              {s.name}
                            </p>
                            <p className="mt-2 font-mono text-sm text-accent">{formatInr(s.price)}</p>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
