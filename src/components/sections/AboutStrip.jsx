import { motion } from 'framer-motion'
import { media } from '../../content/media'
import { SafeImg } from '../ui/SafeImg'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { publicUrl } from '../../lib/publicUrl'

export function AboutStrip() {
  return (
    <section
      id="about"
      className="relative overflow-hidden border-b border-steel/60 bg-ink px-4 py-16 sm:px-6 md:py-20 lg:px-10"
    >
      <img
        src={publicUrl('images/electrical.jpg')}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        loading="lazy"
        decoding="async"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-ink/70" aria-hidden />
      <motion.div
        className="relative z-[1] mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-14"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-steel/70 shadow-[0_20px_50px_-20px_rgba(0,51,102,0.2)] lg:aspect-auto lg:min-h-[300px]">
          <SafeImg
            src={media.about.src}
            alt={media.about.alt}
            fw={1200}
            fh={800}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            width={1200}
            height={800}
            loading="lazy"
          />
        </div>
        <div>
          <p className="font-display text-7xl font-black leading-none text-accent/20 md:text-8xl">01</p>
          <p className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.2em] text-hud">About us</p>
          <p className="mt-4 font-sans text-xl font-semibold leading-relaxed tracking-tight text-fog md:text-2xl md:leading-snug">
            We&apos;re building India&apos;s most trusted parts shelf — transparent pricing, verified fitment, and
            delivery you can plan around.
          </p>
        </div>
      </motion.div>
    </section>
  )
}
