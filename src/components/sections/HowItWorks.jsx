import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react'
import { DotLottieWc } from '../ui/DotLottieWc'
import { Section } from '../ui/Section'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { sectionBackdrops } from '../../content/media'

const HOW_L = {
  select: 'https://lottie.host/59be8466-5075-4b9b-b248-d50606f20d85/DkXa9lpi4w.lottie',
  book: 'https://lottie.host/37c40b9e-cf6f-459e-aa2e-2c1aad30f22b/AA9dicQ4iD.lottie',
  done: 'https://lottie.host/37cddb70-a4aa-4152-8aac-7f9b64fe2aab/vw0zrpa2Vy.lottie',
}

const steps = [
  {
    key: 'select',
    title: 'Select Service',
    copy: 'Pick from servicing, bodywork, AC, electrical — or talk to our desk for a custom scope.',
    icon: ListChecks,
    lottie: HOW_L.select,
  },
  {
    key: 'book',
    title: 'Book Slot',
    copy: 'Home, office, or hub. Live slots with mechanic assignment — no phantom availability.',
    icon: CalendarCheck,
    lottie: HOW_L.book,
  },
  {
    key: 'done',
    title: 'Get It Done',
    copy: 'Digital report, warranty-backed labour, and parts receipts you can audit line by line.',
    icon: CheckCircle2,
    lottie: HOW_L.done,
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

const AUTO_MS = 6200

export function HowItWorks() {
  const len = steps.length
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

  const active = steps[index]
  const ActiveIcon = active.icon

  return (
    <Section
      id="how"
      eyebrow="Sequence"
      title="How it works"
      subtitle="Three steps from quote to keys — no theatre, just throughput."
      className="relative border-b border-steel/60 bg-slate"
      backdrop={sectionBackdrops.how}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
        className="space-y-8"
      >
        <div
          className="rounded-2xl bg-ink/90 p-4 shadow-[0_16px_48px_-20px_rgba(0,51,102,0.12)] sm:p-6 md:p-8"
          role="region"
          aria-roledescription="carousel"
          aria-label="How it works"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-3 lg:gap-4">
            <button
              type="button"
              onClick={goPrev}
              className="order-2 hidden h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-steel/80 bg-ink text-fog shadow-sm transition-colors hover:border-accent hover:text-accent md:order-1 md:mt-0 md:flex md:self-center"
              aria-label="Previous step"
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
                  key={active.key}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="grid min-h-[min(420px,56vh)] items-center gap-8 md:grid-cols-2 md:gap-10 lg:min-h-[min(460px,60vh)] lg:gap-14"
                >
                  <div className="flex justify-center md:justify-end">
                    <DotLottieWc
                      src={active.lottie}
                      width={420}
                      height={420}
                      className="max-w-full outline-none [box-shadow:none]"
                      style={{
                        width: 'min(420px, 84vw)',
                        height: 'min(420px, 84vw)',
                        maxWidth: 500,
                        maxHeight: 500,
                      }}
                    />
                  </div>

                  <div className="text-center md:text-left md:py-2">
                    <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent md:mb-6">
                      <ActiveIcon className="h-9 w-9" strokeWidth={1.5} aria-hidden />
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-hud">
                      Step {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-wide text-fog sm:text-4xl">
                      {active.title}
                    </h3>
                    <p className="mt-5 max-w-xl font-sans text-lg leading-relaxed text-mist sm:text-xl">
                      {active.copy}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <button
              type="button"
              onClick={goNext}
              className="order-3 hidden h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-steel/80 bg-ink text-fog shadow-sm transition-colors hover:border-accent hover:text-accent md:flex md:self-center"
              aria-label="Next step"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-steel/80 bg-ink text-fog shadow-sm transition-colors hover:border-accent hover:text-accent"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-steel/80 bg-ink text-fog shadow-sm transition-colors hover:border-accent hover:text-accent"
              aria-label="Next step"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <p className="mt-3 text-center font-sans text-xs text-mist md:hidden">Swipe sideways to change step</p>
        </div>
      </motion.div>
    </Section>
  )
}
