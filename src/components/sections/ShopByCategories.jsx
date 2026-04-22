import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { PARTS_CATALOG, getPartImage } from '../../data/partsCatalog'
import { SafeImg } from '../ui/SafeImg'
import { staggerContainer, staggerItem, viewportOnce } from '../../lib/motion'
import { publicUrl } from '../../lib/publicUrl'
import { apiV1Base } from '../../api/client.js'
import { fetchCategories } from '../../services/categoryService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { ApiSectionError } from '../ui/ApiSectionError'

const SHOWCASE_ORDER = ['Brakes', 'Filters', 'Wheels', 'Engine', 'Electrical']

function categoryShowcase() {
  return SHOWCASE_ORDER.map((cat) => PARTS_CATALOG.find((p) => p.category === cat)).filter(Boolean)
}

export function ShopByCategories() {
  const [categoriesError, setCategoriesError] = useState(null)
  const [categoriesRetryKey, setCategoriesRetryKey] = useState(0)

  useEffect(() => {
    if (!apiV1Base()) return
    let cancel = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale error before refetch
    setCategoriesError(null)
    fetchCategories()
      .then(() => {
        if (!cancel) setCategoriesError(null)
      })
      .catch((e) => {
        if (!cancel) setCategoriesError(getFetchErrorMessage(e))
      })
    return () => {
      cancel = true
    }
  }, [categoriesRetryKey])

  const rows = categoryShowcase()

  return (
    <section
      id="categories"
      className="relative overflow-hidden border-b border-steel/60 bg-ink px-4 py-16 sm:px-6 md:py-20 lg:px-10"
    >
      <img
        src={publicUrl('images/engine.jpg')}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        loading="lazy"
        decoding="async"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-ink/70" aria-hidden />
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
              Shop by categories
            </h2>
            <p className="mt-2 max-w-lg text-sm text-mist">
              OEM-grade parts across every major system — pick a category to jump into the catalog.
            </p>
          </div>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-1 self-start rounded-xl bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-on-accent shadow-md transition-[transform,filter] hover:brightness-95 active:scale-[0.98]"
          >
            View all
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </motion.header>

        {apiV1Base() && categoriesError ? (
          <div className="mb-8">
            <ApiSectionError
              title="Category list could not sync"
              message={categoriesError}
              onRetry={() => setCategoriesRetryKey((k) => k + 1)}
              className="text-left sm:text-center"
            />
            <p className="mt-3 text-center font-sans text-xs text-mist">
              Category tiles below are static highlights; live counts come from the API when it is available.
            </p>
          </div>
        ) : null}

        <motion.ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {rows.map((part) => {
            const img = getPartImage(part.imageKey)
            return (
              <motion.li key={part.category} variants={staggerItem}>
                <Link
                  to="/catalog"
                  className="ad-store-card group flex h-full flex-col overflow-hidden rounded-xl border border-steel/80 bg-ink shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(0,51,102,0.18)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate">
                    <SafeImg
                      src={img.src}
                      alt={img.alt}
                      fw={640}
                      fh={480}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={480}
                      height={360}
                      loading="lazy"
                    />
                  </div>
                  <p className="border-t border-steel/60 px-3 py-3 text-center font-display text-sm font-bold uppercase tracking-wide text-fog">
                    {part.category}
                  </p>
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
