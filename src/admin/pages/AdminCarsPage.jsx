import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'
import { validateCarForm } from '../../lib/carFormValidation.js'

const MAX_RAW_FILE = 12 * 1024 * 1024
const PAGE_SIZE = 5
const IST_TIMEZONE = 'Asia/Kolkata'
const istDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZoneName: 'short',
})

function formatIstDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return istDateTimeFormatter.format(date)
}

/** Include current form value in label list so legacy DB values still validate in edit mode. */
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

export function AdminCarsPage() {
  const [items, setItems] = useState([])
  const [allCars, setAllCars] = useState([])
  const [brand, setBrand] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [createPhoto, setCreatePhoto] = useState('')
  const [createBrandLogo, setCreateBrandLogo] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [editForm, setEditForm] = useState(emptyForm())
  const [editPhoto, setEditPhoto] = useState('')
  const [editExistingPhoto, setEditExistingPhoto] = useState('')
  const [clearEditPhoto, setClearEditPhoto] = useState(false)
  const [editBrandLogo, setEditBrandLogo] = useState('')
  const [editExistingBrandLogo, setEditExistingBrandLogo] = useState('')
  const [clearEditBrandLogo, setClearEditBrandLogo] = useState(false)
  const [createErrors, setCreateErrors] = useState({})
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

  const brands = useMemo(
    () =>
      [...new Set((allCars || []).map((c) => c.make).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [allCars],
  )
  async function loadCars(reset = true) {
    setLoading(true)
    setError(null)
    try {
      const result = await adminService.listCarsPage({
        ...(brand ? { brand } : {}),
        page: reset ? 0 : nextPage,
        size: PAGE_SIZE,
      })
      if (reset) {
        setItems(result.items)
      } else {
        setItems((prev) => [...prev, ...result.items])
      }
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch (e) {
      setItems([])
      setError(getFetchErrorMessage(e))
      setHasMore(false)
      setNextPage(1)
    } finally {
      setLoading(false)
    }
  }

  async function refreshBrands() {
    try {
      let page = 0
      let hasMore = true
      const merged = []
      while (hasMore) {
        const result = await adminService.listCarsPage({ page, size: 50 })
        merged.push(...result.items)
        hasMore = result.hasMore
        page = result.nextPage
      }
      setAllCars(merged)
    } catch {
      setAllCars([])
    }
  }

  useEffect(() => {
    loadCars(true)
    refreshBrands()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand])

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

  async function loadMoreCars() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      await loadCars(false)
    } finally {
      setLoadingMore(false)
    }
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

  async function onCreatePhotoPick(ev) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    try {
      setCreatePhoto(await toDataUrl(f))
    } catch (e) {
      setError(getFetchErrorMessage(e))
    }
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

  async function onCreateBrandLogoPick(ev) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    try {
      setCreateBrandLogo(await toDataUrl(f))
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

  async function submitCreate(e) {
    e.preventDefault()
    if (!carFormOptions.fuels?.length || !carFormOptions.transmissions?.length) {
      setError('Fuel and transmission options could not be loaded. Refresh the page and try again.')
      return
    }
    const validation = validateCarForm(form, {
      fuelLabels: catalogLabelsWithLegacy(carFormOptions.fuels, form.fuel),
      transmissionLabels: catalogLabelsWithLegacy(carFormOptions.transmissions, form.transmission),
    })
    if (!validation.values) {
      setCreateErrors(validation.errors)
      return
    }
    setCreateErrors({})
    setBusy(true)
    setError(null)
    try {
      const { make, model, variant, modelYear, fuel } = validation.values
      const body = {
        brandName: make,
        make,
        model,
        variant,
        modelYear,
        fuel,
        transmission: form.transmission.trim() || null,
        engineCc: form.engineCc ? Number(form.engineCc) : null,
        notes: form.notes.trim() || null,
        published: form.published,
      }
      if (createPhoto) body.image = createPhoto
      if (createBrandLogo) body.brandLogo = createBrandLogo
      await adminService.createCar(body)
      setForm(emptyForm())
      setCreatePhoto('')
      setCreateBrandLogo('')
      await Promise.all([loadCars(true), refreshBrands()])
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setBusy(false)
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
        make: car.make ?? '',
        model: car.model ?? '',
        variant: car.variant ?? '',
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
      await Promise.all([loadCars(true), refreshBrands()])
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
      await Promise.all([loadCars(true), refreshBrands()])
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full border border-steel/80 bg-ink/40 px-3 py-2 font-sans text-sm text-fog outline-none focus:border-accent/60'

  function fieldInputClass(hasError) {
    return hasError ? `${inputClass} border-flare/60` : inputClass
  }

  /** Compact h-10 fields for Edit Car modal only */
  const editModalFieldBase =
    'h-10 min-h-10 w-full rounded-lg border border-steel/80 bg-ink/40 px-3 font-sans text-sm leading-none text-fog placeholder:text-mist/70 outline-none focus:border-accent/60'
  function editModalFieldClass(hasError) {
    return hasError ? `${editModalFieldBase} border-flare/60` : editModalFieldBase
  }

  function FieldError({ message }) {
    if (!message) return null
    return <p className="mt-1 text-xs text-flare">{message}</p>
  }

  function clearCreateFieldError(key) {
    if (createErrors[key]) {
      setCreateErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-fog md:text-3xl">Cars</h1>
          <p className="mt-1 text-sm text-mist">Add and manage car catalog by brand with optional photos.</p>
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="admin-cars-brand-filter" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
            FILTER BY BRAND
          </label>
          <select
            id="admin-cars-brand-filter"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={inputClass}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">{error}</div> : null}

      <section className="admin-card p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-fog">
          <Plus className="h-5 w-5 text-accent" />
          Add car
        </div>
        <form onSubmit={submitCreate} className="grid gap-3 md:grid-cols-3" noValidate>
          <div>
            <input
              placeholder="Brand *"
              value={form.make}
              onChange={(e) => {
                setForm((f) => ({ ...f, make: e.target.value }))
                clearCreateFieldError('make')
              }}
              className={fieldInputClass(createErrors.make)}
              aria-invalid={!!createErrors.make}
            />
            <FieldError message={createErrors.make} />
          </div>
          <div>
            <input
              placeholder="Model *"
              value={form.model}
              onChange={(e) => {
                setForm((f) => ({ ...f, model: e.target.value }))
                clearCreateFieldError('model')
              }}
              className={fieldInputClass(createErrors.model)}
              aria-invalid={!!createErrors.model}
            />
            <FieldError message={createErrors.model} />
          </div>
          <div>
            <input
              placeholder="Variant *"
              value={form.variant}
              onChange={(e) => {
                setForm((f) => ({ ...f, variant: e.target.value }))
                clearCreateFieldError('variant')
              }}
              className={fieldInputClass(createErrors.variant)}
              aria-invalid={!!createErrors.variant}
            />
            <FieldError message={createErrors.variant} />
          </div>
          <div>
            <input
              type="number"
              step={1}
              min={1}
              placeholder="Year *"
              value={form.modelYear}
              onChange={(e) => {
                setForm((f) => ({ ...f, modelYear: e.target.value }))
                clearCreateFieldError('modelYear')
              }}
              className={fieldInputClass(createErrors.modelYear)}
              aria-invalid={!!createErrors.modelYear}
            />
            <FieldError message={createErrors.modelYear} />
          </div>
          <div>
            <select
              value={form.fuel}
              onChange={(e) => {
                setForm((f) => ({ ...f, fuel: e.target.value }))
                clearCreateFieldError('fuel')
              }}
              className={fieldInputClass(createErrors.fuel)}
              aria-invalid={!!createErrors.fuel}
              aria-label="Fuel"
            >
              <option value="">Select fuel *</option>
              {(carFormOptions.fuels || []).map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
            <FieldError message={createErrors.fuel} />
          </div>
          <div>
            <select
              value={form.transmission}
              onChange={(e) => {
                setForm((f) => ({ ...f, transmission: e.target.value }))
                clearCreateFieldError('transmission')
              }}
              className={fieldInputClass(createErrors.transmission)}
              aria-invalid={!!createErrors.transmission}
              aria-label="Transmission"
            >
              <option value="">Transmission (optional)</option>
              {(carFormOptions.transmissions || []).map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
            <FieldError message={createErrors.transmission} />
          </div>
          <input type="number" min={0} placeholder="Engine CC" value={form.engineCc} onChange={(e) => setForm((f) => ({ ...f, engineCc: e.target.value }))} className={inputClass} />
          <label className="flex items-center gap-2 rounded-xl border border-steel/70 px-3 py-2 text-sm text-fog">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            Published
          </label>
          <div className="md:col-span-3">
            <textarea rows={2} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={`${inputClass} resize-y`} />
          </div>
          <div className="md:col-span-3 rounded-xl border border-steel/50 bg-ink/20 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Photo (optional)</p>
            <input type="file" accept="image/*" disabled={busy} onChange={onCreatePhotoPick} className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-on-accent" />
            {createPhoto ? <img src={createPhoto} alt="Car preview" className="mt-2 h-20 w-28 rounded-lg border border-steel/60 object-cover" /> : null}
          </div>
          <div className="md:col-span-3 rounded-xl border border-steel/50 bg-ink/20 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Brand logo (optional)</p>
            <input type="file" accept="image/*" disabled={busy} onChange={onCreateBrandLogoPick} className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-hud file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-white" />
            {createBrandLogo ? <img src={createBrandLogo} alt="Brand logo preview" className="mt-2 h-16 w-16 rounded-lg border border-steel/60 object-cover" /> : null}
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" disabled={busy} className="rounded-xl bg-accent px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-accent disabled:opacity-50">
              {busy ? 'Saving…' : 'Create car'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-steel/50 font-mono text-[10px] uppercase tracking-wider text-mist">
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Fuel</th>
                <th className="px-4 py-3">Transmission</th>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Brand logo</th>
                <th className="px-4 py-3">Created (IST)</th>
                <th className="px-4 py-3">Updated (IST)</th>
                <th className="px-4 py-3 text-center">Live</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel/40">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-mist">Loading cars…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-mist">No cars found.</td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="text-mist hover:bg-steel/25">
                    <td className="px-4 py-3 font-medium text-fog">{row.make}</td>
                    <td className="px-4 py-3">{row.model}</td>
                    <td className="px-4 py-3">{row.variant || '—'}</td>
                    <td className="px-4 py-3">{row.modelYear ?? '—'}</td>
                    <td className="px-4 py-3">{row.fuel || '—'}</td>
                    <td className="px-4 py-3">{row.transmission || '—'}</td>
                    <td className="px-4 py-3">{row.image ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{row.brandLogo ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{formatIstDateTime(row.createdAt)}</td>
                    <td className="px-4 py-3">{formatIstDateTime(row.updatedAt)}</td>
                    <td className="px-4 py-3 text-center">{row.published ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => startEdit(row.id)} className="rounded-lg p-2 text-mist hover:bg-steel/50 hover:text-hud" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => removeCar(row)} className="rounded-lg p-2 text-mist hover:bg-flare-muted hover:text-flare" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadMoreCars()}
            disabled={loadingMore}
            className="rounded-xl border border-steel/80 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
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
                      <input type="number" min={0} placeholder="Engine CC" value={editForm.engineCc} onChange={(e) => setEditForm((f) => ({ ...f, engineCc: e.target.value }))} className={editModalFieldBase} />
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
                      <textarea rows={2} placeholder="Notes (optional)" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} className={`${editModalFieldBase} min-h-[4.25rem] resize-y py-2 leading-snug`} />
                    </div>
                    <div className="space-y-2 border-t border-steel/35 pt-4">
                      <div className="rounded-lg border border-steel/50 bg-ink/20 p-4">
                      <p className="mb-1.5 text-xs font-semibold tracking-wide text-hud">PHOTO (OPTIONAL)</p>
                      <input type="file" accept="image/*" onChange={onEditPhotoPick} className="text-xs text-mist file:mr-2 file:rounded-md file:border-0 file:bg-accent file:px-2.5 file:py-1.5 file:font-mono file:text-[10px] file:text-on-accent" />
                      {editPhoto ? <img src={editPhoto} alt="Edited preview" className="mt-1.5 h-[4.5rem] w-24 rounded-md border border-steel/60 object-cover" /> : null}
                      {!editPhoto && editExistingPhoto && !clearEditPhoto ? (
                        <img src={editExistingPhoto} alt="Current" className="mt-1.5 h-[4.5rem] w-24 rounded-md border border-steel/60 object-cover" />
                      ) : null}
                      <label className="mt-1.5 inline-flex items-center gap-2 text-xs font-medium text-mist">
                        <input className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500" type="checkbox" checked={clearEditPhoto} onChange={(e) => setClearEditPhoto(e.target.checked)} />
                        Remove existing photo
                      </label>
                    </div>
                    </div>
                    <div className="space-y-2 border-t border-steel/35 pt-4">
                      <div className="rounded-lg border border-steel/50 bg-ink/20 p-4">
                      <p className="mb-1.5 text-xs font-semibold tracking-wide text-hud">BRAND LOGO (OPTIONAL)</p>
                      <input type="file" accept="image/*" onChange={onEditBrandLogoPick} className="text-xs text-mist file:mr-2 file:rounded-md file:border-0 file:bg-hud file:px-2.5 file:py-1.5 file:font-mono file:text-[10px] file:text-white" />
                      {editBrandLogo ? <img src={editBrandLogo} alt="Edited brand logo preview" className="mt-1.5 h-14 w-14 rounded-md border border-steel/60 object-cover" /> : null}
                      {!editBrandLogo && editExistingBrandLogo && !clearEditBrandLogo ? (
                        <img src={editExistingBrandLogo} alt="Current brand logo" className="mt-1.5 h-14 w-14 rounded-md border border-steel/60 object-cover" />
                      ) : null}
                      <label className="mt-1.5 inline-flex items-center gap-2 text-xs font-medium text-mist">
                        <input className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500" type="checkbox" checked={clearEditBrandLogo} onChange={(e) => setClearEditBrandLogo(e.target.checked)} />
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
