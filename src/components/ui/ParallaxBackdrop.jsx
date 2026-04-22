import { motion, useScroll, useTransform } from 'framer-motion'
import { SafeImg } from './SafeImg'

const toneVar = {
  ink: '--color-ink',
  slate: '--color-slate',
  void: '--color-void',
}

/**
 * Full-bleed background photo with scroll-linked vertical motion.
 * `tone` selects which theme token the scrim mixes from (matches section surface).
 */
export function ParallaxBackdrop({ containerRef, src, alt, fw = 1600, fh = 960, tone = 'ink' }) {
  const cssVar = toneVar[tone] ?? toneVar.ink
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <motion.div
        className="parallax-backdrop-img absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2"
        style={{ y }}
      >
        <SafeImg
          src={src}
          alt={alt || ''}
          fw={fw}
          fh={fh}
          className="h-full w-full object-cover"
          width={fw}
          height={fh}
          loading="lazy"
        />
      </motion.div>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            color-mix(in srgb, var(${cssVar}) 86%, transparent) 0%,
            color-mix(in srgb, var(${cssVar}) 94%, transparent) 100%
          )`,
        }}
      />
    </div>
  )
}
