import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import {
  augmentPart,
  formatInr,
  getPartById,
  getPartImage,
  getSuggestedParts,
} from '../../data/partsCatalog'
import { useCart } from '../../context/useCart'
import { SafeImg } from '../ui/SafeImg'
import { Button } from '../ui/Button'
import { CartQtyStepper } from '../cart/CartQtyStepper'
import { ApiSectionError } from '../ui/ApiSectionError'

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
  const { getQty, addToCart, openCart } = useCart()
  const raw = resolvedPart ?? (partId ? getPartById(partId) : null)
  const part = raw ? augmentPart(raw) : null
  const qty = part ? getQty(part.id) : 0

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
  const suggestions = part && catalogRef ? getSuggestedParts(catalogRef, 4) : []

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
          <header className="flex shrink-0 items-center gap-3 border-b border-fog/10 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="clip-chamfer-sm flex items-center gap-2 border border-fog/15 bg-steel/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-fog transition-colors hover:border-accent/40 hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Back
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-hud">{part.sku}</p>
              <h1 id="part-detail-title" className="truncate font-display text-lg font-bold uppercase tracking-wide text-fog sm:text-xl">
                {part.name}
              </h1>
            </div>
            <p className="hidden font-mono text-lg font-semibold text-accent sm:block">{formatInr(part.price)}</p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                {(part.galleryUrls?.length
                  ? part.galleryUrls.map((g, i) => ({ key: `url-${i}`, src: g.src, alt: g.alt }))
                  : part.galleryKeys.map((key) => {
                      const img = getPartImage(key)
                      return { key, src: img.src, alt: img.alt }
                    })
                ).map(({ key, src, alt }) => (
                  <div
                    key={`${part.id}-${key}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-md border border-fog/10 bg-slate/40"
                  >
                    <SafeImg
                      src={src}
                      alt={alt}
                      fw={720}
                      fh={540}
                      className="h-full w-full object-cover"
                      width={720}
                      height={540}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              <div className="mb-8 border border-fog/10 bg-steel/20 p-6 clip-chamfer-sm">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">Description</p>
                <p className="mt-4 font-sans text-base leading-relaxed text-mist">{part.description}</p>
                <p className="mt-6 font-mono text-[10px] uppercase tracking-wider text-hud">Fits</p>
                <p className="mt-2 font-sans text-sm text-fog">{part.compatibleCars.join(', ')}</p>
              </div>

              <div className="mb-10 rounded border border-fog/10 bg-ink/40 px-4 py-4">
                <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-mist">
                  <span className="text-hud">Available</span>
                  <span className="tabular-nums text-fog">
                    {Math.max(0, part.totalStock - getQty(part.id))}/{part.totalStock}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-sm border border-fog/15 bg-void/40"
                  role="progressbar"
                  aria-valuenow={Math.max(0, part.totalStock - getQty(part.id))}
                  aria-valuemin={0}
                  aria-valuemax={part.totalStock}
                >
                  <div
                    className={`h-full rounded-sm transition-[width] duration-300 ${
                      part.totalStock - getQty(part.id) <= 0 ? 'bg-mist/40' : 'bg-accent'
                    }`}
                    style={{
                      width: `${part.totalStock ? (Math.max(0, part.totalStock - getQty(part.id)) / part.totalStock) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                {qty <= 0 ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="sm:min-w-[200px]"
                    type="button"
                    disabled={part.totalStock <= 0}
                    onClick={() => addToCart(part.id, 1)}
                  >
                    Add to cart
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <CartQtyStepper partId={part.id} maxStock={part.totalStock} />
                    <Button variant="primary" size="lg" className="sm:min-w-[180px]" type="button" onClick={openCart}>
                      <span className="inline-flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        Go to cart
                      </span>
                    </Button>
                  </div>
                )}
                <Button variant="ghost" size="lg" type="button" onClick={onClose}>
                  Keep browsing
                </Button>
              </div>

              {suggestions.length > 0 && (
                <section className="mt-16 border-t border-fog/10 pt-12">
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
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
