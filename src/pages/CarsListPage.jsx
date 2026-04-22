import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CarDetailOverlay } from '../components/cars/CarDetailOverlay'
import { CarListingCard } from '../components/cars/CarListingCard'
import { CARS_CATALOG } from '../data/carsCatalog'
import { publicUrl } from '../lib/publicUrl'
import { apiV1Base } from '../api/client.js'
import { fetchCars } from '../services/fitmentService.js'
import { getFetchErrorMessage } from '../lib/apiErrorMessage.js'
import { ApiSectionError } from '../components/ui/ApiSectionError'

const FILTERS = [
  { value: 'all', label: 'All cars' },
  { value: 'first-hand', label: 'First hand' },
  { value: 'second-hand', label: '2nd hand' },
]

export function CarsListPage() {
  const useApi = Boolean(apiV1Base())
  const navigate = useNavigate()
  const [condition, setCondition] = useState('all')
  const [detailId, setDetailId] = useState(null)
  const [apiCars, setApiCars] = useState(null)
  const [vehiclesError, setVehiclesError] = useState(null)
  const [vehiclesLoading, setVehiclesLoading] = useState(useApi)
  const [vehiclesRetryKey, setVehiclesRetryKey] = useState(0)

  useEffect(() => {
    if (!useApi) return
    let cancel = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag before async fetch
    setVehiclesLoading(true)
    setVehiclesError(null)
    fetchCars()
      .then((d) => {
        if (!cancel) {
          setApiCars((d || []).map((api) => ({
            id: api.id,
            title: `${api.make} ${api.model}${api.variant ? ` ${api.variant}` : ''}`,
            year: api.modelYear ?? new Date().getFullYear(),
            price: null,
            condition: 'second-hand',
            km: 0,
            fuel: api.fuel || '—',
            transmission: api.transmission || '—',
            location: '—',
            image: api.image || '',
            imageAlt: `${api.make} ${api.model}`,
            gallery: api.image ? [{ src: api.image, alt: `${api.make} ${api.model}` }] : [],
            description: api.notes || '',
            make: api.make,
            model: api.model,
          })))
          setVehiclesLoading(false)
          setVehiclesError(null)
        }
      })
      .catch((e) => {
        if (!cancel) {
          setApiCars(null)
          setVehiclesLoading(false)
          setVehiclesError(getFetchErrorMessage(e))
        }
      })
    return () => {
      cancel = true
    }
  }, [useApi, vehiclesRetryKey])

  const allCars = useMemo(() => {
    if (!useApi) return CARS_CATALOG
    if (vehiclesError) return []
    return apiCars ?? []
  }, [useApi, vehiclesError, apiCars])

  const filtered = useMemo(() => {
    if (condition === 'all') return allCars
    return allCars.filter((c) => c.condition === condition)
  }, [condition, allCars])

  const overlayCar = detailId ? filtered.find((c) => c.id === detailId) ?? allCars.find((c) => c.id === detailId) : null

  return (
    <div className="relative min-h-svh min-w-0 overflow-x-clip bg-slate pt-[calc(var(--nav-h)+1rem)] pb-16">
      <img
        src={publicUrl('images/mirror.jpg')}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        loading="lazy"
        decoding="async"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-slate/75" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-[1680px] px-4 lg:px-6 xl:px-10">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-hud transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Back to home
        </Link>

        <header className="mb-10 rounded-2xl border border-steel/70 bg-ink/85 p-6 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">Vehicles for sale</p>
          <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-wide text-fog sm:text-4xl">
            Buy cars
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-mist sm:text-base">
            Browse first-hand and pre-owned inventory. Open any card for full details and photos; use Enquiry to reach
            our team by email (demo).
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setCondition(f.value)}
                className={`rounded-xl border px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wide transition-[border-color,background-color,color] ${
                  condition === f.value
                    ? 'border-accent/50 bg-accent-muted text-accent'
                    : 'border-steel/70 bg-ink/90 text-fog hover:border-accent/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {useApi && vehiclesLoading ? (
          <p className="py-16 text-center font-sans text-sm text-mist">Loading vehicles…</p>
        ) : null}

        {useApi && vehiclesError ? (
          <ApiSectionError
            title="Vehicles could not load"
            message={vehiclesError}
            onRetry={() => setVehiclesRetryKey((k) => k + 1)}
            className="mb-8"
          />
        ) : null}

        {!vehiclesLoading && !vehiclesError && filtered.length === 0 ? (
          <p className="py-16 text-center font-sans text-mist">No cars match this filter.</p>
        ) : null}

        {!vehiclesLoading && !vehiclesError && filtered.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((car) => (
              <li key={car.id}>
                <CarListingCard
                  car={car}
                  onViewDetails={setDetailId}
                  onViewParts={(selected) =>
                    navigate(
                      `/catalog?carId=${encodeURIComponent(selected.id)}&carModel=${encodeURIComponent(selected.make ? `${selected.make} ${selected.model}` : selected.title)}`,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-wider text-mist">
          {vehiclesError ? '—' : `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`} · Prices indicative
          (demo)
        </p>
      </div>

      <CarDetailOverlay
        carId={detailId}
        resolvedCar={useApi ? overlayCar : undefined}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}
