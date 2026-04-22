import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Battery,
  ChevronLeft,
  ChevronRight,
  Fuel,
  MapPin,
  Paintbrush,
  Truck,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react'
import { DotLottieWc } from '../ui/DotLottieWc'
import { Section } from '../ui/Section'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { sectionBackdrops } from '../../content/media'

const L = {
  towing: 'https://lottie.host/37cddb70-a4aa-4152-8aac-7f9b64fe2aab/vw0zrpa2Vy.lottie',
  diagnostics: 'https://lottie.host/37c40b9e-cf6f-459e-aa2e-2c1aad30f22b/AA9dicQ4iD.lottie',
  servicing: 'https://lottie.host/59be8466-5075-4b9b-b248-d50606f20d85/DkXa9lpi4w.lottie',
  paint: 'https://lottie.host/e33e9f99-1859-4eca-9004-47951d8edf24/lVVCJ8LPTm.lottie',
}

const services = [
  {
    title: 'Towing',
    description:
      'Flatbed and wheel-lift dispatch when you’re stranded — tracked ETA, upfront pricing, and drivers who know how to secure your car without drama.',
    lottie: L.towing,
    icon: Truck,
    tint: 'bg-orange-500/15 text-accent',
  },
  {
    title: 'Roadside fuel',
    description:
      'Emergency fuel delivery to your location so you’re not pushing the car to the nearest pump. Safe handling, correct grade, and quick handoff.',
    lottie: L.towing,
    icon: Fuel,
    tint: 'bg-hud/15 text-hud',
  },
  {
    title: 'Car servicing',
    description:
      'Scheduled maintenance with OEM filters and fluids, digital job cards, and quality checks you can see — not a black-box invoice.',
    lottie: L.servicing,
    icon: Wrench,
    tint: 'bg-amber-500/15 text-amber-700',
  },
  {
    title: 'Dent & paint',
    description:
      'Panel repair, paintless dent removal, and booth-quality refinishing with color-matched topcoats and insurance-friendly estimates.',
    lottie: L.paint,
    icon: Paintbrush,
    tint: 'bg-pink-500/15 text-pink-600',
  },
  {
    title: 'AC repair',
    description:
      'Leak tests, gas top-up, compressor and blower work — cabin comfort restored with proper evacuation and recharge protocols.',
    lottie: L.diagnostics,
    icon: Wind,
    tint: 'bg-cyan-500/15 text-cyan-700',
  },
  {
    title: 'Battery swap',
    description:
      'On-site voltage and load tests, OEM-spec replacements, and instant install so you’re not left hunting jump leads.',
    lottie: L.diagnostics,
    icon: Battery,
    tint: 'bg-emerald-500/15 text-emerald-700',
  },
  {
    title: 'Tyre care',
    description:
      'Rotation, balancing, puncture repair, and replacement with the right load/speed index — we match what your placard demands.',
    lottie: L.servicing,
    icon: MapPin,
    tint: 'bg-violet-500/15 text-violet-700',
  },
  {
    title: 'Diagnostics',
    description:
      'Scanner-backed fault tracing, live data, and clear explanations before we replace parts — fix the root cause, not the symptom.',
    lottie: L.diagnostics,
    icon: Zap,
    tint: 'bg-sky-500/15 text-sky-700',
  },
]

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 56 : direction < 0 ? -56 : 0,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction < 0 ? 56 : direction > 0 ? -56 : 0,
    opacity: 0,
  }),
}

const AUTO_MS = 6500

export function Services() {
  const len = services.length
  const [[index, direction], setSlide] = useState([0, 0])

  const goNext = useCallback(() => {
    setSlide(([i]) => [((i + 1) % len + len) % len, 1])
  }, [len])

  const goPrev = useCallback(() => {
    setSlide(([i]) => [((i - 1 + len) % len + len) % len, -1])
  }, [len])

  useEffect(() => {
    const t = window.setInterval(goNext, AUTO_MS)
    return () => window.clearInterval(t)
  }, [goNext])

  const active = services[index]
  const ActiveIcon = active.icon

  return (
    <Section
      id="services"
      eyebrow="On demand"
      title="Our services"
      subtitle="Workshop-grade jobs at your driveway or hub — book any lane in the app."
      className="border-b border-steel/60 bg-ink"
      backdrop={sectionBackdrops.services}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
        className="space-y-8"
      >
        <div
          className="rounded-2xl bg-slate/40 p-4 shadow-[0_16px_48px_-20px_rgba(0,51,102,0.12)] sm:p-6 md:p-8"
          role="region"
          aria-roledescription="carousel"
          aria-label="Our services"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-3 lg:gap-4">
            <button
              type="button"
              onClick={goPrev}
              className="order-2 hidden h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-steel/80 bg-ink text-fog shadow-sm transition-colors hover:border-accent hover:text-accent md:order-1 md:mt-0 md:flex md:self-center"
              aria-label="Previous service"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>

            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x + info.velocity.x * 0.25
                if (swipe < -72) goNext()
                else if (swipe > 72) goPrev()
              }}
              className="order-1 min-w-0 flex-1 touch-pan-y md:order-2"
            >
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={index}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="grid min-h-[min(440px,58vh)] items-center gap-10 md:grid-cols-2 md:gap-12 lg:min-h-[min(480px,62vh)] lg:gap-16 xl:gap-20"
                >
                  <div className="flex justify-center md:justify-end">
                    <DotLottieWc
                      src={active.lottie}
                      width={440}
                      height={440}
                      className="max-w-full outline-none [box-shadow:none]"
                      style={{
                        width: 'min(440px, 88vw)',
                        height: 'min(440px, 88vw)',
                        maxWidth: 520,
                        maxHeight: 520,
                      }}
                    />
                  </div>

                  <div className="text-center md:text-left md:py-2">
                    <div
                      className={`mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl md:mx-0 lg:h-[4.5rem] lg:w-[4.5rem] ${active.tint}`}
                    >
                      <ActiveIcon className="h-9 w-9 lg:h-10 lg:w-10" strokeWidth={1.5} aria-hidden />
                    </div>
                    <h3 className="font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-wide text-fog sm:text-4xl lg:text-5xl">
                      {active.title}
                    </h3>
                    <p className="mt-5 max-w-xl font-sans text-lg leading-relaxed text-mist sm:text-xl lg:mt-6 lg:max-w-none lg:text-[1.35rem] lg:leading-relaxed">
                      {active.description}
                    </p>
                    <p className="mt-8 font-sans text-base font-semibold text-accent lg:text-lg">
                      Tap to book · same-day slots
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <button
              type="button"
              onClick={goNext}
              className="order-3 hidden h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-steel/80 bg-ink text-fog shadow-sm transition-colors hover:border-accent hover:text-accent md:flex md:self-center"
              aria-label="Next service"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-steel/80 bg-ink text-fog shadow-sm transition-colors hover:border-accent hover:text-accent"
              aria-label="Previous service"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-steel/80 bg-ink text-fog shadow-sm transition-colors hover:border-accent hover:text-accent"
              aria-label="Next service"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <p className="mt-3 text-center font-sans text-xs text-mist md:hidden">Swipe sideways to change service</p>
        </div>
      </motion.div>
    </Section>
  )
}
