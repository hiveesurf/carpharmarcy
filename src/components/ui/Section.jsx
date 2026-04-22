import { useRef } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { ParallaxBackdrop } from './ParallaxBackdrop'

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  titleAction = null,
  children,
  className = '',
  bleed = false,
  backdrop = null,
}) {
  const sectionRef = useRef(null)
  const overflow = bleed || backdrop ? 'overflow-hidden' : ''

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`relative px-4 py-20 sm:px-6 md:py-28 lg:px-10 ${overflow} ${className}`}
    >
      {backdrop && (
        <ParallaxBackdrop
          containerRef={sectionRef}
          src={backdrop.src}
          alt={backdrop.alt}
          fw={backdrop.fw}
          fh={backdrop.fh}
          tone={backdrop.tone ?? 'ink'}
        />
      )}
      {bleed && (
        <div
          className="pointer-events-none absolute -right-1/4 top-1/2 z-[1] h-[min(80%,520px)] w-[min(90vw,640px)] -translate-y-1/2 rotate-[-8deg] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,78,32,0.08)_0%,transparent_65%)] blur-3xl"
          aria-hidden
        />
      )}
      <div className="relative z-[2] mx-auto max-w-6xl">
        {(eyebrow || title || subtitle || titleAction) && (
          <motion.header
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeUp}
            className={`mb-14 md:mb-20 lg:mb-24 ${titleAction ? 'flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between' : ''}`}
          >
            <div className={titleAction ? 'max-w-3xl' : 'max-w-3xl'}>
              {eyebrow && (
                <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.35em] text-hud">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-fog sm:text-5xl md:text-6xl md:leading-[0.92]">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-6 max-w-xl font-sans text-base font-medium leading-relaxed tracking-tight text-mist md:text-lg">
                  {subtitle}
                </p>
              )}
            </div>
            {titleAction ? <div className="shrink-0">{titleAction}</div> : null}
          </motion.header>
        )}
        {children}
      </div>
    </section>
  )
}
