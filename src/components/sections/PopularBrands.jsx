import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { staggerContainer, staggerItem, viewportOnce } from '../../lib/motion'
import { publicUrl } from '../../lib/publicUrl'

const brands = [
  { name: 'Hyundai', logo: publicUrl('brands/hyundai.svg'), tone: 'from-slate to-graphite' },
  { name: 'Volkswagen', logo: publicUrl('brands/volkswagen.svg'), tone: 'from-graphite/80 to-steel/60' },
  { name: 'Bosch', logo: publicUrl('brands/bosch.svg'), tone: 'from-hud/15 to-hud/5' },
  { name: 'NGK', logo: publicUrl('brands/ngk.svg'), tone: 'from-slate to-steel/70' },
  { name: 'Mahindra', logo: publicUrl('brands/mahindra.svg'), tone: 'from-graphite/70 to-slate' },
  { name: 'Honda', logo: publicUrl('brands/honda.svg'), tone: 'from-steel/50 to-slate' },
  { name: 'Maruti Suzuki', logo: publicUrl('brands/suzuki.svg'), tone: 'from-slate to-graphite/60' },
  { name: 'Tata', logo: publicUrl('brands/tata.svg'), tone: 'from-hud/10 to-slate' },
]

export function PopularBrands() {
  return (
    <section className="relative overflow-hidden border-b border-steel/60 bg-slate px-4 py-16 sm:px-6 md:py-20 lg:px-10">
      <img
        src={publicUrl('images/mirror.jpg')}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        loading="lazy"
        decoding="async"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-slate/75" aria-hidden />
      <div className="relative z-[1] mx-auto max-w-6xl">
        <motion.header
          className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide text-fog sm:text-3xl">
              Popular OEM / OES brands
            </h2>
            <p className="mt-2 max-w-lg text-sm text-mist">
              Genuine and OES lines we stock and ship — same brands your service manual names.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 self-start rounded-xl border border-steel/80 bg-ink px-5 py-2.5 font-sans text-sm font-semibold text-hud transition-colors hover:border-accent/40 hover:text-accent">
            View brands
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
        </motion.header>

        <motion.ul
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {brands.map(({ name, logo, tone }) => (
            <motion.li key={name} variants={staggerItem}>
              <div
                className={`ad-store-card flex min-h-[7.5rem] flex-col items-center justify-center gap-3 rounded-xl border border-steel/70 bg-gradient-to-br px-3 py-4 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.1)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(255,107,53,0.2)] sm:min-h-[8.5rem] sm:py-5 ${tone}`}
              >
                <img
                  src={logo}
                  alt=""
                  width={140}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-auto max-h-12 max-w-[min(140px,88%)] object-contain object-center sm:h-12 sm:max-h-14"
                />
                <span className="text-center font-display text-[11px] font-extrabold uppercase leading-tight tracking-wide text-fog sm:text-xs">
                  {name}
                </span>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
