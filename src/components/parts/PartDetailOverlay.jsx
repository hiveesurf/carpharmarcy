import { useEffect, useMemo, useState } from 'react'
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

  const galleryItems = useMemo(() => {
    if (!part) return []
    if (part.galleryUrls?.length) {
      return part.galleryUrls.map((g, i) => ({
        key: `url-${i}`,
        src: g.src,
        alt: typeof g.alt === 'string' && g.alt.trim() ? g.alt : part.name,
      }))
    }
    if (part.galleryKeys?.length) {
      return part.galleryKeys.map((key) => {
        const img = getPartImage(key)
        return { key, src: img.src, alt: img.alt }
      })
    }
    const fallback = getPartImage(part.imageKey)
    return [{ key: 'fallback', src: fallback.src, alt: fallback.alt }]
  }, [part])

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [partId, part?.id])

  useEffect(() => {
    setSelectedImageIndex((i) => Math.min(i, Math.max(0, galleryItems.length - 1)))
  }, [galleryItems.length])

  const primaryImage = galleryItems[selectedImageIndex] ?? galleryItems[0]
  const leftInStock = part ? Math.max(0, part.totalStock - getQty(part.id)) : 0

  const fitmentItems = useMemo(() => {
    if (!part?.compatibleCars?.length) return []
    const cars = part.compatibleCars
    const onlyAll =
      cars.length === 1 && String(cars[0]).toLowerCase() === 'all vehicles'
    if (onlyAll) return [{ label: cars[0], allVehicles: true }]
    return cars.map((c) => ({ label: String(c), allVehicles: false }))
  }, [part])

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

  const stockProgressSection = part ? (
    <div className="rounded-xl border border-fog/10 bg-ink/40 px-4 py-4">
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-mist">
        <span className="text-hud">Availability</span>
        <span className="tabular-nums text-fog">
          {leftInStock}/{part.totalStock}
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-sm border border-fog/15 bg-void/40"
        role="progressbar"
        aria-valuenow={leftInStock}
        aria-valuemin={0}
        aria-valuemax={part.totalStock}
      >
        <div
          className={`h-full rounded-sm transition-[width] duration-300 ${
            leftInStock <= 0 ? 'bg-mist/40' : 'bg-accent'
          }`}
          style={{
            width: `${part.totalStock ? (leftInStock / part.totalStock) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  ) : null

  const buyBoxActions = part ? (
    <div className="flex flex-col gap-3">
      {qty <= 0 ? (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          type="button"
          disabled={part.totalStock <= 0}
          onClick={() => addToCart(part.id, 1)}
        >
          Add to cart
        </Button>
      ) : (
        <>
          <CartQtyStepper partId={part.id} maxStock={part.totalStock} />
          <Button variant="primary" size="lg" className="w-full" type="button" onClick={openCart}>
            <span className="inline-flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Go to cart
            </span>
          </Button>
        </>
      )}
      <Button variant="ghost" size="lg" type="button" onClick={onClose}>
        Keep browsing
      </Button>
    </div>
  ) : null

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

      {partId && part && (remoteLoadState == null || remoteLoadState === 'ready') && primaryImage && (
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
            <button
              type="button"
              onClick={onClose}
              className="clip-chamfer-sm flex items-center gap-2 border border-fog/15 bg-steel/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-fog transition-colors hover:border-accent/40 hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Back
            </button>
            <p className="font-mono text-[10px] uppercase tracking-wider text-mist">Product details</p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-7xl">
              {/* Mobile: stacked — desktop: 3-column */}
              <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 lg:gap-y-10">
                {/* —— Gallery —— */}
                <div className="order-1 lg:col-span-5">
                  <div className="overflow-hidden rounded-xl border border-fog/10 bg-slate/40 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.35)]">
                    <div className="relative aspect-square w-full sm:aspect-[4/3]">
                      <SafeImg
                        src={primaryImage.src}
                        alt={primaryImage.alt}
                        fw={960}
                        fh={960}
                        className="h-full w-full object-contain bg-void/30"
                        width={960}
                        height={960}
                        loading="eager"
                      />
                    </div>
                  </div>
                  {galleryItems.length > 1 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {galleryItems.map((item, idx) => (
                        <button
                          key={`${part.id}-thumb-${item.key}`}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          aria-label={`View image ${idx + 1}`}
                          aria-pressed={selectedImageIndex === idx}
                          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-[72px] sm:w-[72px] ${
                            selectedImageIndex === idx
                              ? 'border-accent ring-1 ring-accent/40'
                              : 'border-fog/15 hover:border-accent/35'
                          }`}
                        >
                          <SafeImg
                            src={item.src}
                            alt=""
                            fw={144}
                            fh={144}
                            className="h-full w-full object-cover"
                            width={144}
                            height={144}
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* —— Center: product info —— */}
                <div className="order-2 flex flex-col gap-6 lg:col-span-4">
                  <div>
                    <h1
                      id="part-detail-title"
                      className="font-display text-xl font-bold uppercase leading-snug tracking-wide text-fog sm:text-2xl lg:text-[1.65rem]"
                    >
                      {part.name}
                    </h1>
                    <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-accent lg:hidden">
                      {formatInr(part.price)}
                    </p>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-mist">
                    <p>
                      <span className="text-hud">SKU</span>{' '}
                      <span className="text-fog">{part.sku}</span>
                    </p>
                    {part.category ? (
                      <p>
                        <span className="text-hud">Category</span>{' '}
                        <span className="text-fog">{part.category}</span>
                      </p>
                    ) : null}
                  </div>

                  {fitmentItems.length > 0 ? (
                    <div className="border border-fog/10 bg-steel/15 p-5 clip-chamfer-sm">
                      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">Compatibility</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {fitmentItems.map((item, i) => (
                          <span
                            key={`${part.id}-fit-${i}-${item.label}`}
                            className="inline-flex rounded-full border border-steel/70 bg-slate/50 px-3 py-1 font-sans text-xs font-medium text-fog"
                          >
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="border border-fog/10 bg-steel/20 p-6 clip-chamfer-sm">
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">Description</p>
                    <p className="mt-4 font-sans text-base leading-relaxed text-mist">{part.description}</p>
                  </div>

                </div>

                {/* —— Right: buy box (mobile stack order-3, desktop sticky) —— */}
                <aside className="order-3 lg:sticky lg:top-6 lg:col-span-3 lg:self-start">
                  <div className="rounded-2xl border border-steel/70 bg-ink/90 p-5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)]">
                    <p className="mb-4 hidden font-mono text-3xl font-bold tabular-nums leading-none text-accent lg:block">
                      {formatInr(part.price)}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-hud">Stock</p>
                    <p className="mt-1 font-sans text-sm text-fog">
                      {part.totalStock <= 0 ? (
                        <span className="text-flare">Out of stock</span>
                      ) : leftInStock <= 0 ? (
                        <span className="text-mist">Maximum quantity in cart</span>
                      ) : (
                        <>
                          <span className="tabular-nums">{leftInStock}</span> available
                          <span className="text-mist"> · </span>
                          <span className="tabular-nums">{part.totalStock}</span> total
                        </>
                      )}
                    </p>
                    <div className="mt-4">{stockProgressSection}</div>
                    <div className="mt-6 border-t border-fog/10 pt-6">{buyBoxActions}</div>
                  </div>
                </aside>
              </div>

              {/* Related — full width below grid */}
              {suggestions.length > 0 && (
                <section className="mt-14 border-t border-fog/10 pt-12 lg:mt-16">
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
