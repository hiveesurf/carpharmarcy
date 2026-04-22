import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Mail } from 'lucide-react'
import { submitVehicleEnquiry } from '../../services/vehicleEnquiryService.js'
import { formatInr } from '../../data/partsCatalog'
import { CONDITION_LABEL, getCarById, openCarEnquiry } from '../../data/carsCatalog'
import { SafeImg } from '../ui/SafeImg'
import { Button } from '../ui/Button'

export function CarDetailOverlay({ carId, resolvedCar, onClose }) {
  const car = resolvedCar ?? (carId ? getCarById(carId) : null)

  useEffect(() => {
    if (!carId) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [carId])

  useEffect(() => {
    if (!carId) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [carId, onClose])

  return (
    <AnimatePresence>
      {carId && car && (
        <motion.div
          key={carId}
          className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="car-detail-title"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-steel/60 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="clip-chamfer-sm flex items-center gap-2 border border-fog/15 bg-steel/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-fog transition-colors hover:border-accent/40 hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Back
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-hud">
                {CONDITION_LABEL[car.condition]} · {car.year}
              </p>
              <h1
                id="car-detail-title"
                className="truncate font-display text-lg font-bold uppercase tracking-wide text-fog sm:text-xl"
              >
                {car.title}
              </h1>
            </div>
            <p className="hidden shrink-0 font-display text-lg font-black text-accent sm:block">{formatInr(car.price)}</p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-5xl">
              <p className="mb-6 font-display text-2xl font-black text-accent sm:hidden">{formatInr(car.price)}</p>

              {car.gallery?.length > 0 ? (
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  {car.gallery.map((g, i) => (
                    <div
                      key={`${car.id}-g-${i}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-steel/60 bg-slate/40"
                    >
                      <SafeImg
                        src={g.src}
                        alt={g.alt}
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
              ) : null}

              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-steel/70 bg-slate/50 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">Highlights</p>
                  <dl className="mt-4 space-y-3 font-sans text-sm text-mist">
                    <div className="flex justify-between gap-4">
                      <dt>Odometer</dt>
                      <dd className="font-semibold text-fog">{car.km.toLocaleString('en-IN')} km</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Fuel</dt>
                      <dd className="font-semibold text-fog">{car.fuel}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Transmission</dt>
                      <dd className="font-semibold text-fog">{car.transmission}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Location</dt>
                      <dd className="font-semibold text-fog">{car.location}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl border border-steel/70 bg-slate/50 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">Description</p>
                  <p className="mt-4 font-sans text-base leading-relaxed text-mist">{car.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Button
                  variant="primary"
                  size="lg"
                  className="inline-flex items-center justify-center gap-2 sm:min-w-[220px]"
                  type="button"
                  onClick={async () => {
                    await submitVehicleEnquiry(car.id, { channel: 'overlay-enquiry' })
                    openCarEnquiry(car)
                  }}
                >
                  <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  Enquiry
                </Button>
                <Button variant="ghost" size="lg" type="button" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
