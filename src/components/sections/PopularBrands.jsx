import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { staggerContainer, staggerItem, viewportOnce } from '../../lib/motion'
import { publicUrl } from '../../lib/publicUrl'
import { apiV1Base } from '../../api/client.js'
import { fetchPartBrands } from '../../services/partBrandService.js'
import { catalogHref } from '../../lib/partBrand.js'

/** Rotating gradient tones — same palette family as the original static section */
const TONE_CLASSES = [
  'from-slate to-graphite',
  'from-graphite/80 to-steel/60',
  'from-hud/15 to-hud/5',
  'from-slate to-steel/70',
  'from-graphite/70 to-slate',
  'from-steel/50 to-slate',
  'from-slate to-graphite/60',
  'from-hud/10 to-slate',
]

function initialsFromName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  const one = parts[0] ?? '?'
  return one.length >= 2 ? one.slice(0, 2).toUpperCase() : one.toUpperCase()
}

function BrandTile({ id, name, tone }) {
  const [logoOk, setLogoOk] = useState(true)
  const logoSrc = publicUrl(`brands/${id}.svg`)

  return (
    <motion.li variants={staggerItem} className="list-none">
      <Link
        to={catalogHref({ partBrand: name })}
        className={`ad-store-card flex min-h-[7.5rem] flex-col items-center justify-center gap-3 rounded-xl border border-steel/70 bg-gradient-to-br px-3 py-4 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.1)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(255,107,53,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:min-h-[8.5rem] sm:py-5 ${tone}`}
        aria-label={`Shop parts by ${name}`}
      >
        <div className="flex min-h-[2.5rem] w-full flex-col items-center justify-center sm:min-h-[3rem]">
          {logoOk ? (
            <img
              src={logoSrc}
              alt=""
              width={140}
              height={56}
              loading="lazy"
              decoding="async"
              className="h-10 w-auto max-h-12 max-w-[min(140px,88%)] object-contain object-center sm:h-12 sm:max-h-14"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="flex h-11 min-w-[2.75rem] items-center justify-center rounded-xl border border-steel/60 bg-ink/40 px-2 font-display text-sm font-extrabold uppercase tracking-wide text-fog sm:h-14 sm:min-w-[3.5rem] sm:text-base">
              {initialsFromName(name)}
            </span>
          )}
        </div>
        <span className="text-center font-display text-[11px] font-extrabold uppercase leading-tight tracking-wide text-fog sm:text-xs">
          {name}
        </span>
      </Link>
    </motion.li>
  )
}

function BrandsSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="list-none">
          <div className="flex min-h-[7.5rem] animate-pulse flex-col items-center justify-center gap-3 rounded-xl border border-steel/50 bg-steel/20 px-3 py-4 sm:min-h-[8.5rem] sm:py-5">
            <div className="h-10 w-24 rounded-lg bg-steel/40 sm:h-12" />
            <div className="h-3 w-20 rounded bg-steel/40" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function PopularBrands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(() => Boolean(apiV1Base()))

  useEffect(() => {
    if (!apiV1Base()) {
      setLoading(false)
      setBrands([])
      return
    }
    let cancelled = false
    setLoading(true)
    fetchPartBrands()
      .then((rows) => {
        if (!cancelled) setBrands(Array.isArray(rows) ? rows.slice(0, 8) : [])
      })
      .catch(() => {
        if (!cancelled) setBrands([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!loading && brands.length === 0) return null

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
          <Link
            to="/catalog"
            className="inline-flex items-center gap-1 self-start rounded-xl border border-steel/80 bg-ink px-5 py-2.5 font-sans text-sm font-semibold text-hud transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            View brands
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </motion.header>

        {loading ? (
          <BrandsSkeleton />
        ) : (
          <motion.ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {brands.map((b, index) => (
              <BrandTile
                key={b.id || b.name}
                id={b.id}
                name={b.name}
                tone={TONE_CLASSES[index % TONE_CLASSES.length]}
              />
            ))}
          </motion.ul>
        )}
      </div>
    </section>
  )
}
