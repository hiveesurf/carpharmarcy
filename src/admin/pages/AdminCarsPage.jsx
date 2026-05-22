import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { AdminStatCard } from '../components/AdminStatCard.jsx'
import { carBrandLogoUrl, carListImageUrl } from '../../lib/adminCarAssets.js'
import { computeCarKpis, matchesAdminCarSearch } from '../../lib/adminCarListStats.js'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'
import { validateCarForm } from '../../lib/carFormValidation.js'
import {
  carIdentityKey,
  dedupeBrandLabelsFromCars,
  normalizeCarBrand,
  normalizeCarText,
} from '../../lib/carIdentityNormalize.js'

const MAX_RAW_FILE = 12 * 1024 * 1024
const LIST_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300
const ACTIONS_MENU_GAP = 6
const ACTIONS_MENU_EST_HEIGHT = 132
const ACTIONS_MENU_MIN_WIDTH = 168

const carActionTriggerClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-mist transition-colors hover:border-steel/60 hover:bg-steel/30'

const carActionMenuItemClass =
  'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-fog hover:bg-steel/30 disabled:cursor-not-allowed disabled:opacity-40'
const IST_TIMEZONE = 'Asia/Kolkata'
const istDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const istDateFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
})

const compactSearchClass =
  'h-9 w-full min-w-0 flex-1 rounded-xl border border-steel/80 bg-ink/40 py-1.5 pl-8 pr-2.5 text-xs text-fog placeholder:text-mist focus:border-accent/50 focus:outline-none'

const headerBtnSecondary =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-steel/80 bg-ink/30 px-3 font-mono text-[10px] font-medium uppercase tracking-wider text-fog transition-colors hover:border-accent/50 hover:bg-accent/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50'

function formatIstDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return istDateTimeFormatter.format(date)
}

/** Compact one-line date for table cells */
function formatIstDateShort(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return istDateFormatter.format(date)
}

function catalogLabelsWithLegacy(apiOptions, currentValue) {
  const labels = (apiOptions || []).map((o) => o?.label).filter(Boolean)
  const cur = String(currentValue ?? '').trim()
  if (cur && !labels.includes(cur)) labels.push(cur)
  return labels
}

function emptyForm() {
  return {
    make: '',
    model: '',
    variant: '',
    modelYear: '',
    fuel: '',
    transmission: '',
    engineCc: '',
    notes: '',
    published: true,
  }
}

function CarImageThumb({ car, className = 'h-14 w-14 shrink-0' }) {
  const [broken, setBroken] = useState(false)
  const src = carListImageUrl(car)
  const title = [car?.make, car?.model].filter(Boolean).join(' ') || 'Car'

  if (!src || broken) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-xl border border-steel/50 bg-ink/30`}
        aria-hidden
      >
        <Car className="h-5 w-5 text-mist/70" strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={title}
      width={56}
      height={56}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={`${className} rounded-xl border border-steel/40 object-cover bg-ink/20`}
    />
  )
}

function CarBrandMark({ car, className = 'h-8 w-8 shrink-0' }) {
  const [broken, setBroken] = useState(false)
  const src = carBrandLogoUrl(car)
  const brand = car?.make || 'Brand'

  if (!src || broken) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-lg border border-steel/50 bg-ink/25 font-mono text-[9px] font-medium uppercase text-mist`}
        title={brand}
      >
        {String(brand).slice(0, 2)}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={`${brand} logo`}
      width={32}
      height={32}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={`${className} rounded-lg border border-steel/40 object-contain bg-white p-0.5`}
    />
  )
}

function fuelBadgeClass(fuel) {
  const f = String(fuel || '').toLowerCase()
  if (f.includes('electric') || f.includes('ev')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  if (f.includes('diesel')) return 'border-hud/30 bg-hud/10 text-hud'
  if (f.includes('petrol') || f.includes('gas')) return 'border-accent/35 bg-accent/10 text-accent'
  return 'border-steel/50 bg-ink/25 text-mist'
}

function carRowLabel(car) {
  return [car?.make, car?.model].filter(Boolean).join(' ') || 'car'
}

/** List table: title line (make + model). */
function carListTitle(car) {
  const title = `${car?.make || ''} ${car?.model || ''}`.trim()
  return title || '—'
}

/** List table: subtitle is variant only — never year. */
function carListSubtitle(car) {
  return car?.variant || '—'
}

/** List table: year column only. */
function carListYear(car) {
  const year = car?.modelYear ?? car?.model_year ?? car?.year
  if (year == null || year === '') return '—'
  return String(year)
}

/**
 * Three-dot row menu (portal avoids table overflow clipping).
 */
function CarRowActions({ car, open, onOpenChange, disabled, onView, onEdit, onDelete }) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [menuPos, setMenuPos] = useState(null)
  const label = carRowLabel(car)

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight ?? ACTIONS_MENU_EST_HEIGHT
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < menuHeight + ACTIONS_MENU_GAP + 12
    const top = openUpward ? rect.top - menuHeight - ACTIONS_MENU_GAP : rect.bottom + ACTIONS_MENU_GAP
    const right = Math.max(8, window.innerWidth - rect.right)
    setMenuPos({ top, right })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    updateMenuPosition()
    const raf = requestAnimationFrame(updateMenuPosition)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(ev) {
      const target = ev.target
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      onOpenChange(false)
    }
    function onKeyDown(ev) {
      if (ev.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: menuPos?.top ?? -9999,
              right: menuPos?.right ?? 8,
              minWidth: ACTIONS_MENU_MIN_WIDTH,
              zIndex: 200,
              visibility: menuPos ? 'visible' : 'hidden',
            }}
            className="overflow-hidden rounded-lg border border-steel/60 bg-slate py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={carActionMenuItemClass}
              onClick={() => {
                onOpenChange(false)
                onView(car)
              }}
            >
              <Eye className="h-4 w-4 shrink-0 text-mist" aria-hidden />
              View
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={carActionMenuItemClass}
              onClick={() => {
                onOpenChange(false)
                onEdit(car)
              }}
            >
              <Pencil className="h-4 w-4 shrink-0 text-mist" aria-hidden />
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={`${carActionMenuItemClass} text-flare hover:bg-flare-muted/30`}
              onClick={() => {
                onOpenChange(false)
                onDelete(car)
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              Delete
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          onOpenChange(!open)
        }}
        className={`${carActionTriggerClass} ${open ? 'border-steel/60 bg-steel/30' : ''}`}
        aria-label={`Actions for ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {menu}
    </>
  )
}

export function AdminCarsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [allCars, setAllCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [listRefresh, setListRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(LIST_PAGE_SIZE)
  const [openActionsCarId, setOpenActionsCarId] = useState(null)
  const [viewCar, setViewCar] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm())
  const [editPhoto, setEditPhoto] = useState('')
  const [editExistingPhoto, setEditExistingPhoto] = useState('')
  const [clearEditPhoto, setClearEditPhoto] = useState(false)
  const [editBrandLogo, setEditBrandLogo] = useState('')
  const [editExistingBrandLogo, setEditExistingBrandLogo] = useState('')
  const [clearEditBrandLogo, setClearEditBrandLogo] = useState(false)
  const [editErrors, setEditErrors] = useState({})
  const [carFormOptions, setCarFormOptions] = useState({ fuels: [], transmissions: [] })
  const [editLoading, setEditLoading] = useState(false)
  const editLoadSeq = useRef(0)

  const closeEditModal = useCallback(() => {
    editLoadSeq.current += 1
    setEditingId(null)
    setEditLoading(false)
    setEditErrors({})
  }, [])

  const brands = useMemo(() => dedupeBrandLabelsFromCars(allCars), [allCars])
  const kpis = useMemo(() => computeCarKpis(allCars), [allCars])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    const state = location.state
    if (state?.success) {
      setSuccessMessage('Car added successfully')
      setListRefresh((n) => n + 1)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    if (!brandFilter) return
    const match = brands.find((b) => carIdentityKey(b) === carIdentityKey(brandFilter))
    if (match && match !== brandFilter) setBrandFilter(match)
  }, [brands, brandFilter])

  const loadAllCars = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let page = 0
      let hasMore = true
      const merged = []
      while (hasMore) {
        const result = await adminService.listCarsPage({ page, size: 50 })
        merged.push(...(result.items || []))
        hasMore = result.hasMore
        page = result.nextPage
      }
      setAllCars(merged.filter((x) => !x?.deleted && !x?.deletedAt))
    } catch (e) {
      setAllCars([])
      setError(getFetchErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllCars()
  }, [loadAllCars, listRefresh])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const o = await adminService.listCarFormOptions()
        if (!cancelled) setCarFormOptions(o)
      } catch {
        if (!cancelled) setCarFormOptions({ fuels: [], transmissions: [] })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setVisibleCount(LIST_PAGE_SIZE)
  }, [debouncedSearch, brandFilter])

  const filteredCars = useMemo(() => {
    let list = allCars
    if (brandFilter) {
      const key = carIdentityKey(brandFilter)
      list = list.filter((c) => carIdentityKey(c.make) === key)
    }
    if (debouncedSearch) {
      list = list.filter((c) => matchesAdminCarSearch(c, debouncedSearch))
    }
    return list
  }, [allCars, brandFilter, debouncedSearch])

  const visibleItems = useMemo(
    () => filteredCars.slice(0, visibleCount),
    [filteredCars, visibleCount],
  )
  const hasMoreVisible = visibleCount < filteredCars.length

  function bumpList() {
    setListRefresh((n) => n + 1)
  }

  async function toDataUrl(file) {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed.')
    }
    if (file.size > MAX_RAW_FILE) {
      throw new Error('Image too large before compression (max 12MB file).')
    }
    return imageFileToCompressedDataUrl(file)
  }

  async function onEditPhotoPick(ev) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    try {
      setEditPhoto(await toDataUrl(f))
      setClearEditPhoto(false)
    } catch (e) {
      setError(getFetchErrorMessage(e))
    }
  }

  async function onEditBrandLogoPick(ev) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    try {
      setEditBrandLogo(await toDataUrl(f))
      setClearEditBrandLogo(false)
    } catch (e) {
      setError(getFetchErrorMessage(e))
    }
  }

  async function startEdit(id) {
    setError(null)
    const seq = ++editLoadSeq.current
    setEditingId(id)
    setEditLoading(true)
    setEditForm(emptyForm())
    setEditExistingPhoto('')
    setEditExistingBrandLogo('')
    setEditPhoto('')
    setEditBrandLogo('')
    setClearEditPhoto(false)
    setClearEditBrandLogo(false)
    setEditErrors({})
    try {
      const car = await adminService.getCar(id)
      if (editLoadSeq.current !== seq) return
      if (!car) {
        setEditingId(null)
        setEditLoading(false)
        return
      }
      setEditForm({
        make: normalizeCarBrand(car.make ?? ''),
        model: normalizeCarText(car.model ?? ''),
        variant: normalizeCarText(car.variant ?? ''),
        modelYear: car.modelYear ?? '',
        fuel: car.fuel ?? '',
        transmission: car.transmission ?? '',
        engineCc: car.engineCc ?? '',
        notes: car.notes ?? '',
        published: !!car.published,
      })
      setEditExistingPhoto(typeof car.image === 'string' ? car.image : '')
      setEditExistingBrandLogo(typeof car.brandLogo === 'string' ? car.brandLogo : '')
      setEditErrors({})
    } catch (e) {
      if (editLoadSeq.current !== seq) return
      setError(getFetchErrorMessage(e))
      setEditingId(null)
    } finally {
      if (editLoadSeq.current === seq) setEditLoading(false)
    }
  }

  useEffect(() => {
    if (!editingId) return undefined
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeEditModal()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [editingId, closeEditModal])

  async function submitEdit(e) {
    e.preventDefault()
    if (!editingId || editLoading) return
    if (!carFormOptions.fuels?.length || !carFormOptions.transmissions?.length) {
      setError('Fuel and transmission options could not be loaded. Refresh the page and try again.')
      return
    }
    const validation = validateCarForm(editForm, {
      fuelLabels: catalogLabelsWithLegacy(carFormOptions.fuels, editForm.fuel),
      transmissionLabels: catalogLabelsWithLegacy(carFormOptions.transmissions, editForm.transmission),
    })
    if (!validation.values) {
      setEditErrors(validation.errors)
      return
    }
    setEditErrors({})
    setBusy(true)
    setError(null)
    try {
      let imageToSend = editExistingPhoto
      if (clearEditPhoto) imageToSend = ''
      if (editPhoto) imageToSend = editPhoto
      let brandLogoToSend = editExistingBrandLogo
      if (clearEditBrandLogo) brandLogoToSend = ''
      if (editBrandLogo) brandLogoToSend = editBrandLogo
      const { make, model, variant, modelYear, fuel } = validation.values
      const body = {
        brandName: make,
        make,
        model,
        variant,
        modelYear,
        fuel,
        transmission: editForm.transmission.trim() || null,
        engineCc: editForm.engineCc ? Number(editForm.engineCc) : null,
        notes: editForm.notes.trim() || null,
        published: editForm.published,
        image: imageToSend,
        brandLogo: brandLogoToSend,
      }
      await adminService.updateCar(editingId, body)
      closeEditModal()
      bumpList()
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function removeCar(row) {
    if (!window.confirm(`Delete car "${row.make} ${row.model}"?`)) return
    setBusy(true)
    setError(null)
    try {
      await adminService.removeCar(row.id)
      bumpList()
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const editModalFieldBase =
    'h-10 min-h-10 w-full rounded-lg border border-steel/80 bg-ink/40 px-3 font-sans text-sm leading-none text-fog placeholder:text-mist/70 outline-none focus:border-accent/60'

  function editModalFieldClass(hasError) {
    return hasError ? `${editModalFieldBase} border-flare/60` : editModalFieldBase
  }

  function FieldError({ message }) {
    if (!message) return null
    return <p className="mt-1 text-xs text-flare">{message}</p>
  }

  function clearEditFieldError(key) {
    if (editErrors[key]) {
      setEditErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const toolbarSelectClass =
    'h-9 rounded-xl border border-steel/80 bg-ink/40 px-3 font-mono text-[10px] uppercase tracking-wider text-fog focus:border-accent/50 focus:outline-none'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-fog md:text-3xl">Cars</h1>
          <p className="mt-1 max-w-xl text-sm text-mist">
            Add and manage car catalog by brand with optional photos.
          </p>
        </div>
        <Link
          to="/admin/cars/add"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 font-display text-sm font-bold uppercase tracking-wide text-on-accent shadow-md transition-[filter] hover:brightness-95"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add car
        </Link>
      </div>

      {successMessage ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-fog shadow-sm"
        >
          <span className="font-medium text-emerald-700 dark:text-emerald-300">{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="rounded-lg p-1 text-mist hover:bg-steel/30 hover:text-fog"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total cars"
          value={loading ? '…' : kpis.total}
          icon={Car}
          accent="text-accent"
          helper="Active catalog vehicles"
        />
        <AdminStatCard
          label="Published"
          value={loading ? '…' : kpis.published}
          icon={CheckCircle2}
          accent="text-emerald-600 dark:text-emerald-400"
          tone="online"
          helper="Live on storefront"
        />
        <AdminStatCard
          label="Draft"
          value={loading ? '…' : kpis.draft}
          icon={EyeOff}
          accent="text-mist"
          tone="offline"
          helper="Not published"
        />
        <AdminStatCard
          label="Brands"
          value={loading ? '…' : kpis.brands}
          icon={Layers}
          accent="text-hud"
          helper="Unique makes in catalog"
        />
      </div>

      <div className="admin-card flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, model, variant, year…"
            aria-label="Search cars"
            className={compactSearchClass}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className={`${toolbarSelectClass} min-w-[10rem]`}
            aria-label="Filter by brand"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => bumpList()}
            disabled={loading}
            className={headerBtnSecondary}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            Refresh
          </button>
        </div>
      </div>

      {debouncedSearch ? (
        <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
          Showing {filteredCars.length} match{filteredCars.length === 1 ? '' : 'es'} for &ldquo;{debouncedSearch}
          &rdquo;
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">{error}</div>
      ) : null}

      <section className="admin-card overflow-visible rounded-2xl">
        <div className="overflow-visible pb-1">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col style={{ width: '26%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-steel/50 bg-ink/20 font-mono text-[10px] uppercase tracking-wider text-mist">
                <th className="px-4 py-3.5 text-left font-medium">Car</th>
                <th className="px-3 py-3.5 text-left font-medium">Brand</th>
                <th className="px-3 py-3.5 text-left font-medium">Model</th>
                <th className="px-3 py-3.5 text-left font-medium">Variant</th>
                <th className="px-3 py-3.5 text-left font-medium">Year</th>
                <th className="px-3 py-3.5 text-left font-medium">Fuel</th>
                <th className="px-3 py-3.5 text-left font-medium">Created</th>
                <th className="px-2 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-mist">
                    Loading cars…
                  </td>
                </tr>
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-mist">
                    {debouncedSearch || brandFilter
                      ? 'No cars match your filters — try adjusting search or brand.'
                      : 'No cars in catalog — add one with the button above.'}
                  </td>
                </tr>
              ) : (
                visibleItems.map((row) => (
                  <tr key={row.id} className="text-mist transition-colors hover:bg-steel/20">
                    <td className="align-middle px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <CarImageThumb car={row} className="h-14 w-14 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-semibold leading-tight text-fog">
                            {carListTitle(row)}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-mist">{carListSubtitle(row)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle px-3 py-3.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CarBrandMark car={row} className="h-9 w-9 shrink-0" />
                        <span className="truncate text-sm font-medium text-fog">{row.make || '—'}</span>
                      </div>
                    </td>
                    <td className="align-middle px-3 py-3.5">
                      <span className="block truncate text-sm text-fog">{row.model || '—'}</span>
                    </td>
                    <td className="align-middle px-3 py-3.5">
                      <span className="block truncate text-sm text-mist">{row.variant || '—'}</span>
                    </td>
                    <td className="align-middle px-3 py-3.5">
                      <span className="font-display text-sm font-semibold tabular-nums text-fog">
                        {carListYear(row)}
                      </span>
                    </td>
                    <td className="align-middle px-3 py-3.5">
                      {row.fuel ? (
                        <span
                          className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${fuelBadgeClass(row.fuel)}`}
                        >
                          {row.fuel}
                        </span>
                      ) : (
                        <span className="text-mist">—</span>
                      )}
                    </td>
                    <td className="align-middle px-3 py-3.5">
                      <span
                        className="block whitespace-nowrap text-sm text-fog"
                        title={formatIstDateTime(row.createdAt)}
                      >
                        {formatIstDateShort(row.createdAt)}
                      </span>
                    </td>
                    <td className="align-middle px-2 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <CarRowActions
                          car={row}
                          open={openActionsCarId === row.id}
                          onOpenChange={(next) => setOpenActionsCarId(next ? row.id : null)}
                          disabled={busy}
                          onView={(c) => {
                            setViewCar(c)
                            setOpenActionsCarId(null)
                          }}
                          onEdit={(c) => startEdit(c.id)}
                          onDelete={(c) => removeCar(c)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {hasMoreVisible ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + LIST_PAGE_SIZE)}
            className="rounded-xl border border-steel/80 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist transition-colors hover:border-accent/50 hover:text-accent"
          >
            Load more ({filteredCars.length - visibleCount} remaining)
          </button>
        </div>
      ) : null}

      {viewCar ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setViewCar(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-view-car-title"
            className="flex max-h-[80vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-steel/60 bg-slate shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-steel/50 bg-slate px-6 py-4">
              <h2 id="admin-view-car-title" className="font-display text-base font-semibold tracking-tight text-fog md:text-lg">
                View Car
              </h2>
              <button
                type="button"
                onClick={() => setViewCar(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-steel/60 text-fog transition-colors hover:bg-steel/30"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <div className="flex items-start gap-4">
                <CarImageThumb car={viewCar} className="h-20 w-20 shrink-0" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-fog">{carListTitle(viewCar)}</p>
                  <p className="mt-0.5 font-mono text-sm text-mist">{carListSubtitle(viewCar)}</p>
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ['Brand', viewCar.make || '—'],
                  ['Model', viewCar.model || '—'],
                  ['Variant', viewCar.variant || '—'],
                  ['Year', carListYear(viewCar)],
                  ['Fuel', viewCar.fuel || '—'],
                  ['Transmission', viewCar.transmission || '—'],
                  ['Status', viewCar.published ? 'Published' : 'Draft'],
                  ['Created', formatIstDateTime(viewCar.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-steel/40 bg-ink/20 px-3 py-2.5">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-mist">{label}</dt>
                    <dd className="mt-1 text-sm text-fog">{value}</dd>
                  </div>
                ))}
              </dl>
              {viewCar.notes ? (
                <div className="rounded-xl border border-steel/40 bg-ink/20 px-3 py-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-mist">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fog">{viewCar.notes}</p>
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-steel/50 bg-slate px-6 py-4">
              <button
                type="button"
                onClick={() => setViewCar(null)}
                className={headerBtnSecondary}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = viewCar.id
                  setViewCar(null)
                  if (id) startEdit(id)
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-accent/50 bg-accent/10 px-3 font-mono text-[10px] font-medium uppercase tracking-wider text-accent transition-colors hover:bg-accent/20"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingId ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={closeEditModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-edit-car-title"
            className="flex max-h-[80vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-steel/60 bg-slate shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-steel/50 bg-slate px-6 py-4">
              <h2 id="admin-edit-car-title" className="font-display text-base font-semibold tracking-tight text-fog md:text-lg">
                Edit Car
              </h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-steel/60 text-fog transition-colors hover:bg-steel/30"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editLoading ? (
              <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-mist">Loading car…</div>
            ) : (
              <>
                <form id="admin-edit-car-form" onSubmit={submitEdit} className="flex min-h-0 flex-1 flex-col" noValidate>
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                    <div className="border-b border-steel/35 pb-3">
                      <p className="text-xs font-semibold tracking-wide text-fog/90">Vehicle details</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <input
                          placeholder="Brand *"
                          value={editForm.make}
                          onChange={(e) => {
                            setEditForm((f) => ({ ...f, make: e.target.value }))
                            clearEditFieldError('make')
                          }}
                          className={editModalFieldClass(editErrors.make)}
                          aria-invalid={!!editErrors.make}
                        />
                        <FieldError message={editErrors.make} />
                      </div>
                      <div>
                        <input
                          placeholder="Model *"
                          value={editForm.model}
                          onChange={(e) => {
                            setEditForm((f) => ({ ...f, model: e.target.value }))
                            clearEditFieldError('model')
                          }}
                          className={editModalFieldClass(editErrors.model)}
                          aria-invalid={!!editErrors.model}
                        />
                        <FieldError message={editErrors.model} />
                      </div>
                      <div>
                        <input
                          placeholder="Variant *"
                          value={editForm.variant}
                          onChange={(e) => {
                            setEditForm((f) => ({ ...f, variant: e.target.value }))
                            clearEditFieldError('variant')
                          }}
                          className={editModalFieldClass(editErrors.variant)}
                          aria-invalid={!!editErrors.variant}
                        />
                        <FieldError message={editErrors.variant} />
                      </div>
                      <div>
                        <input
                          type="number"
                          step={1}
                          min={1}
                          placeholder="Year *"
                          value={editForm.modelYear}
                          onChange={(e) => {
                            setEditForm((f) => ({ ...f, modelYear: e.target.value }))
                            clearEditFieldError('modelYear')
                          }}
                          className={editModalFieldClass(editErrors.modelYear)}
                          aria-invalid={!!editErrors.modelYear}
                        />
                        <FieldError message={editErrors.modelYear} />
                      </div>
                      <input
                        type="number"
                        min={0}
                        placeholder="Engine CC"
                        value={editForm.engineCc}
                        onChange={(e) => setEditForm((f) => ({ ...f, engineCc: e.target.value }))}
                        className={editModalFieldBase}
                      />
                      <div>
                        <select
                          value={editForm.fuel}
                          onChange={(e) => {
                            setEditForm((f) => ({ ...f, fuel: e.target.value }))
                            clearEditFieldError('fuel')
                          }}
                          className={editModalFieldClass(editErrors.fuel)}
                          aria-invalid={!!editErrors.fuel}
                          aria-label="Fuel"
                        >
                          <option value="">Select fuel *</option>
                          {(() => {
                            const api = carFormOptions.fuels || []
                            const seen = new Set(api.map((o) => o.label))
                            const cur = (editForm.fuel || '').trim()
                            const extra = cur && !seen.has(cur) ? [{ label: cur }] : []
                            return [...api, ...extra].map((o) => (
                              <option key={o.label} value={o.label}>
                                {o.label}
                              </option>
                            ))
                          })()}
                        </select>
                        <FieldError message={editErrors.fuel} />
                      </div>
                      <div>
                        <select
                          value={editForm.transmission}
                          onChange={(e) => {
                            setEditForm((f) => ({ ...f, transmission: e.target.value }))
                            clearEditFieldError('transmission')
                          }}
                          className={editModalFieldClass(editErrors.transmission)}
                          aria-invalid={!!editErrors.transmission}
                          aria-label="Transmission"
                        >
                          <option value="">Transmission (optional)</option>
                          {(() => {
                            const api = carFormOptions.transmissions || []
                            const seen = new Set(api.map((o) => o.label))
                            const cur = (editForm.transmission || '').trim()
                            const extra = cur && !seen.has(cur) ? [{ label: cur }] : []
                            return [...api, ...extra].map((o) => (
                              <option key={o.label} value={o.label}>
                                {o.label}
                              </option>
                            ))
                          })()}
                        </select>
                        <FieldError message={editErrors.transmission} />
                      </div>
                      <label className="flex h-10 items-center rounded-lg border border-steel/80 bg-ink/40 px-3 text-sm font-medium text-fog">
                        <input
                          className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
                          type="checkbox"
                          checked={editForm.published}
                          onChange={(e) => setEditForm((f) => ({ ...f, published: e.target.checked }))}
                        />
                        <span className="ml-2">Published</span>
                      </label>
                    </div>
                    <div className="space-y-2 border-t border-steel/35 pt-4">
                      <p className="text-xs font-semibold tracking-wide text-fog/90">Notes</p>
                      <textarea
                        rows={2}
                        placeholder="Notes (optional)"
                        value={editForm.notes}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                        className={`${editModalFieldBase} min-h-[4.25rem] resize-y py-2 leading-snug`}
                      />
                    </div>
                    <div className="space-y-2 border-t border-steel/35 pt-4">
                      <div className="rounded-lg border border-steel/50 bg-ink/20 p-4">
                        <p className="mb-1.5 text-xs font-semibold tracking-wide text-hud">PHOTO (OPTIONAL)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onEditPhotoPick}
                          className="text-xs text-mist file:mr-2 file:rounded-md file:border-0 file:bg-accent file:px-2.5 file:py-1.5 file:font-mono file:text-[10px] file:text-on-accent"
                        />
                        {editPhoto ? (
                          <img
                            src={editPhoto}
                            alt="Edited preview"
                            className="mt-1.5 h-[4.5rem] w-24 rounded-md border border-steel/60 object-cover"
                          />
                        ) : null}
                        {!editPhoto && editExistingPhoto && !clearEditPhoto ? (
                          <img
                            src={editExistingPhoto}
                            alt="Current"
                            className="mt-1.5 h-[4.5rem] w-24 rounded-md border border-steel/60 object-cover"
                          />
                        ) : null}
                        <label className="mt-1.5 inline-flex items-center gap-2 text-xs font-medium text-mist">
                          <input
                            className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
                            type="checkbox"
                            checked={clearEditPhoto}
                            onChange={(e) => setClearEditPhoto(e.target.checked)}
                          />
                          Remove existing photo
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2 border-t border-steel/35 pt-4">
                      <div className="rounded-lg border border-steel/50 bg-ink/20 p-4">
                        <p className="mb-1.5 text-xs font-semibold tracking-wide text-hud">BRAND LOGO (OPTIONAL)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onEditBrandLogoPick}
                          className="text-xs text-mist file:mr-2 file:rounded-md file:border-0 file:bg-hud file:px-2.5 file:py-1.5 file:font-mono file:text-[10px] file:text-white"
                        />
                        {editBrandLogo ? (
                          <img
                            src={editBrandLogo}
                            alt="Edited brand logo preview"
                            className="mt-1.5 h-14 w-14 rounded-md border border-steel/60 object-cover"
                          />
                        ) : null}
                        {!editBrandLogo && editExistingBrandLogo && !clearEditBrandLogo ? (
                          <img
                            src={editExistingBrandLogo}
                            alt="Current brand logo"
                            className="mt-1.5 h-14 w-14 rounded-md border border-steel/60 object-cover"
                          />
                        ) : null}
                        <label className="mt-1.5 inline-flex items-center gap-2 text-xs font-medium text-mist">
                          <input
                            className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
                            type="checkbox"
                            checked={clearEditBrandLogo}
                            onChange={(e) => setClearEditBrandLogo(e.target.checked)}
                          />
                          Remove existing brand logo
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-steel/50 bg-slate px-6 py-4 shadow-[0_-8px_20px_-14px_rgba(0,0,0,0.7)]">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-steel/70 px-4 text-sm font-semibold uppercase tracking-[0.08em] text-mist transition-colors hover:border-hud/60 hover:text-hud"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="admin-edit-car-form"
                    disabled={busy}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-on-accent shadow-md transition-[filter] hover:brightness-95 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {busy ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
