import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { staggerContainer, staggerItem } from '../../lib/motion'
import { markHeroUserLeftHome } from '../../lib/heroSession'
import { publicUrl } from '../../lib/publicUrl'
import {
  fetchVehicleBrands,
  fetchVehicleModels,
  fetchVehicleYears,
  fetchVehicleVariants,
  submitVehicleSearch,
} from '../../services/fitmentService.js'
import { apiGet, apiV1Base } from '../../api/client.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { ApiSectionError } from '../ui/ApiSectionError'

/** Auto-rotate interval (ms); pauses while the tab is hidden. */
const HERO_BG_AUTO_MS = 6000

/** One full-bleed photo at a time; auto-rotates and tap empty hero area to jump ahead (forms/links stay usable). */
const HERO_BG_IMAGES = [
  'images/engine.jpg',
  'images/suspension.jpg',
  'images/electrical.jpg',
  'images/mirror.jpg',
  'images/oil.jpg',
  'images/tyres.jpg',
  'images/car_ceramix_brake_pads.png',
].map((p) => publicUrl(p))

function HeroBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-[8%] top-[8%] h-[min(55vw,280px)] w-[min(55vw,280px)] rounded-full bg-white/12 blur-2xl" />
      <div className="absolute -left-[4%] top-[18%] h-[min(45vw,220px)] w-[min(45vw,220px)] rounded-full bg-white/8 blur-xl" />
    </div>
  )
}

function SelectField({ label, value, onChange, children, id, disabled = false }) {
  return (
    <label htmlFor={id} className="block">
      <span className="sr-only">{label}</span>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full cursor-pointer appearance-none rounded-lg border border-[#d8dce3] bg-white py-3 pl-3 pr-10 font-sans text-sm outline-none transition-[border-color,box-shadow] focus:border-[#f15a24] focus:ring-2 focus:ring-[#f15a24]/25 ${value ? 'text-[#1a1d24]' : 'text-[#9aa0a8]'}`}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a8]"
          strokeWidth={2}
          aria-hidden
        />
      </div>
    </label>
  )
}

export function Hero() {
  const navigate = useNavigate()

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [variant, setVariant] = useState('')
  const [bgIndex, setBgIndex] = useState(0)
  const [brandList, setBrandList] = useState([])
  const [modelList, setModelList] = useState([])
  const [yearList, setYearList] = useState([])
  const [variantList, setVariantList] = useState([])
  const [fitmentLoading, setFitmentLoading] = useState(true)
  const [yearsLoading, setYearsLoading] = useState(false)
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [liveApiError, setLiveApiError] = useState(null)
  const [heroRetryKey, setHeroRetryKey] = useState(0)

  const activeBgSrc = HERO_BG_IMAGES[bgIndex] ?? HERO_BG_IMAGES[0]

  const nextBg = useCallback(() => {
    setBgIndex((i) => (i + 1) % HERO_BG_IMAGES.length)
  }, [])

  useEffect(() => {
    let id
    const arm = () => {
      clearInterval(id)
      id = setInterval(nextBg, HERO_BG_AUTO_MS)
    }
    const onVis = () => {
      if (document.hidden) clearInterval(id)
      else arm()
    }
    arm()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [nextBg])

  useEffect(() => {
    if (!apiV1Base()) {
      setLiveApiError(null)
      return
    }
    let cancel = false
    setLiveApiError(null)
    apiGet('/health')
      .then(() => {
        if (!cancel) setLiveApiError(null)
      })
      .catch((e) => {
        if (!cancel) setLiveApiError(getFetchErrorMessage(e))
      })
    return () => {
      cancel = true
    }
  }, [heroRetryKey])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setFitmentLoading(true)
      try {
        const brands = await fetchVehicleBrands()
        if (!cancelled) setBrandList(Array.isArray(brands) ? brands : [])
      } finally {
        if (!cancelled) setFitmentLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!brand) {
      setModelList([])
      setModel('')
      setYearList([])
      setYear('')
      setVariantList([])
      setVariant('')
      return
    }
    let cancelled = false
    ;(async () => {
      const items = await fetchVehicleModels(brand)
      if (!cancelled) {
        setModelList(Array.isArray(items) ? items : [])
        setModel('')
        setYear('')
        setVariant('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [brand])

  useEffect(() => {
    if (!brand) {
      setYearList([])
      setYear('')
      return
    }
    let cancelled = false
    setYearsLoading(true)
    ;(async () => {
      try {
        const items = await fetchVehicleYears({ brandId: brand, modelId: model || undefined })
        if (!cancelled) {
          setYearList(Array.isArray(items) ? items : [])
          setYear('')
        }
      } finally {
        if (!cancelled) setYearsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [brand, model])

  useEffect(() => {
    if (!brand) {
      setVariantList([])
      setVariant('')
      return
    }
    let cancelled = false
    setVariantsLoading(true)
    ;(async () => {
      try {
        const items = await fetchVehicleVariants({
          brandId: brand,
          modelId: model || undefined,
          year: year || undefined,
        })
        if (!cancelled) {
          setVariantList(Array.isArray(items) ? items : [])
          setVariant('')
        }
      } finally {
        if (!cancelled) setVariantsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [brand, model, year])

  const vehicleSearch = async (e) => {
    e.preventDefault()
    markHeroUserLeftHome()
    const fuelLabel = variantList.find((v) => v.id === variant)?.label
    await submitVehicleSearch({
      brandId: brand,
      modelId: model,
      year,
      variantId: variant,
      fuel: fuelLabel || undefined,
    })
    const params = new URLSearchParams()
    if (brand) params.set('brandId', brand)
    if (model) params.set('carId', model)
    if (year) params.set('year', year)
    if (fuelLabel) params.set('fuel', fuelLabel)
    const qs = params.toString()
    navigate(qs ? `/catalog?${qs}` : '/catalog')
  }

  const variantPlaceholder = !brand
    ? 'Select brand first'
    : variantsLoading
      ? 'Loading variants…'
      : variantList.length === 0
        ? 'No variants available'
        : 'Select Variant'

  return (
    <section className="relative min-h-[72dvh] overflow-hidden md:min-h-[76dvh] lg:min-h-[80dvh]">
      <div className="absolute inset-0 z-0 bg-[#0b1220]" aria-hidden />
      <AnimatePresence mode="wait">
        <motion.div
          key={bgIndex}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <img
            src={activeBgSrc}
            alt=""
            className="h-full min-h-[72dvh] w-full object-cover object-center md:min-h-[76dvh] lg:min-h-[80dvh]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </motion.div>
      </AnimatePresence>

      {/* Clicks pass through gradient/blobs; hit this layer to cycle photos */}
      <button
        type="button"
        className="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f15a24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]"
        onClick={nextBg}
        aria-label="Change hero background photo"
      />

      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(95deg,rgba(8,13,24,0.66)_0%,rgba(8,13,24,0.46)_45%,rgba(8,13,24,0.32)_100%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <HeroBlobs />
      </div>

      <motion.div
        className="pointer-events-none relative z-[4] mx-auto grid max-w-6xl gap-10 px-4 pb-6 pt-[calc(var(--nav-h)+1.25rem)] sm:px-6 sm:pb-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-14 lg:px-10 lg:pt-[calc(var(--nav-h)+1.5rem)]"
        initial={{ opacity: 0, y: '10%' }}
        animate={{ opacity: 1, y: '0%' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto order-2 w-full max-w-[440px] lg:order-1"
        >
          <div className="rounded-2xl bg-white p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] sm:p-8">
            <h2 className="text-center font-display text-lg font-extrabold uppercase tracking-wide sm:text-xl">
              <span className="text-[#f15a24]">Search</span>
              <span className="text-[#1a1d24]"> by vehicle</span>
            </h2>

            {liveApiError ? (
              <div className="mt-4">
                <ApiSectionError
                  title="Could not reach the API"
                  message={liveApiError}
                  onRetry={() => setHeroRetryKey((k) => k + 1)}
                  className="border-[#f15a24]/25 bg-[#fff8f5] !p-4 text-left shadow-none [&_p]:text-[#5c6370]"
                />
                <p className="mt-2 text-center font-sans text-[11px] leading-relaxed text-[#6b7280]">
                  Start Spring Boot on port 8080 (or set <code className="text-[#f15a24]">VITE_API_BASE</code>) and tap Try again.
                </p>
              </div>
            ) : null}

            <form onSubmit={vehicleSearch} className="mt-6">
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Car brand"
                  id="hero-brand"
                  value={brand}
                  onChange={(value) => {
                    setBrand(value)
                    setModel('')
                    setYear('')
                    setVariant('')
                  }}
                >
                  <option value="" disabled hidden>
                    {fitmentLoading ? 'Loading brands…' : 'Select Car Brand'}
                  </option>
                  {brandList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Car model"
                  id="hero-model"
                  value={model}
                  onChange={(value) => {
                    setModel(value)
                    setYear('')
                    setVariant('')
                  }}
                >
                  <option value="" disabled hidden>
                    {!brand ? 'Select brand first' : 'Select Car Model'}
                  </option>
                  {modelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName ?? m.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Year"
                  id="hero-year"
                  value={year}
                  onChange={(value) => {
                    setYear(value)
                    setVariant('')
                  }}
                >
                  <option value="" disabled hidden>
                    {!brand ? 'Select brand first' : yearsLoading ? 'Loading years…' : 'Select Year'}
                  </option>
                  {yearList.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Variant"
                  id="hero-variant"
                  value={variant}
                  onChange={setVariant}
                  disabled={!brand || variantsLoading || variantList.length === 0}
                >
                  <option value="" disabled hidden>
                    {variantPlaceholder}
                  </option>
                  {variantList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </SelectField>
              </div>
              <button
                type="submit"
                disabled={fitmentLoading}
                className="mt-5 w-full rounded-lg bg-[#f15a24] py-3.5 text-center font-sans text-sm font-bold uppercase tracking-wide text-white shadow-md transition-[filter,transform] hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Search
              </button>
            </form>
          </div>
        </motion.div>

        <div className="pointer-events-none order-1 flex flex-col lg:order-2 lg:pt-4">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="w-full">
            <motion.div variants={staggerItem} className="flex items-start gap-3 sm:gap-4">
              <span
                className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#22c55e] shadow-lg sm:h-14 sm:w-14"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-black uppercase leading-[1.08] tracking-tight text-white drop-shadow-sm">
                  Assured delivery
                </p>
                <p className="mt-2 font-sans text-lg font-bold text-white sm:text-xl">
                  Guaranteed on-time delivery
                </p>
                <p className="mt-3 max-w-md font-sans text-sm font-medium leading-relaxed text-white/95 sm:text-base">
                  Delivered late? Get <span className="font-bold">DOUBLE</span> your shipping cost
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="relative mt-8 max-w-lg overflow-hidden rounded-l-2xl bg-gradient-to-r from-[#003366] via-[#044a8f] to-[#0a5fb8] py-4 pl-4 pr-10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)] sm:pl-5 sm:pr-14"
            >
              <div
                className="absolute -right-0 top-0 h-full w-10 skew-x-[12deg] bg-[#0a5fb8]/90"
                aria-hidden
              />
              <ul className="relative space-y-3 font-sans text-sm font-semibold leading-snug text-white sm:text-[0.95rem]">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/95 text-[#22c55e] shadow-sm">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>2X Cashback Guaranteed</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/95 text-[#22c55e] shadow-sm">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    Shop confidently with carpharmacy. Your time and trust are our top priority.
                  </span>
                </li>
              </ul>
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="mt-6 max-w-lg font-sans text-xs leading-relaxed text-white/80"
            >
              *Terms and conditions apply. Valid for eligible orders only.
            </motion.p>
          </motion.div>

          <motion.div
            className="pointer-events-auto mt-8 lg:mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
          >
            <Link
              to="/#parts"
              className="font-sans text-sm font-semibold text-white/95 underline-offset-4 transition-colors hover:text-white"
            >
              Browse featured parts →
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
