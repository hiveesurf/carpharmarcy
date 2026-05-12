import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'

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
    setBusy(true)
    setError(null)
    try {
      const body = {
        brandName: form.make.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        variant: form.variant.trim() || null,
        modelYear: form.modelYear ? Number(form.modelYear) : null,
        fuel: form.fuel.trim() || null,
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
    try {
      const car = await adminService.getCar(id)
      if (!car) return
      setEditingId(id)
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
      setEditPhoto('')
      setEditBrandLogo('')
      setClearEditPhoto(false)
      setClearEditBrandLogo(false)
    } catch (e) {
      setError(getFetchErrorMessage(e))
    }
  }

  async function submitEdit(e) {
    e.preventDefault()
    if (!editingId) return
    setBusy(true)
    setError(null)
    try {
      let imageToSend = editExistingPhoto
      if (clearEditPhoto) imageToSend = ''
      if (editPhoto) imageToSend = editPhoto
      let brandLogoToSend = editExistingBrandLogo
      if (clearEditBrandLogo) brandLogoToSend = ''
      if (editBrandLogo) brandLogoToSend = editBrandLogo
      const body = {
        brandName: editForm.make.trim(),
        make: editForm.make.trim(),
        model: editForm.model.trim(),
        variant: editForm.variant.trim() || null,
        modelYear: editForm.modelYear ? Number(editForm.modelYear) : null,
        fuel: editForm.fuel.trim() || null,
        transmission: editForm.transmission.trim() || null,
        engineCc: editForm.engineCc ? Number(editForm.engineCc) : null,
        notes: editForm.notes.trim() || null,
        published: editForm.published,
        image: imageToSend,
        brandLogo: brandLogoToSend,
      }
      await adminService.updateCar(editingId, body)
      setEditingId(null)
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
        <form onSubmit={submitCreate} className="grid gap-3 md:grid-cols-3">
          <input required placeholder="Brand" value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} className={inputClass} />
          <input required placeholder="Model" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className={inputClass} />
          <input placeholder="Variant" value={form.variant} onChange={(e) => setForm((f) => ({ ...f, variant: e.target.value }))} className={inputClass} />
          <input type="number" min={1900} max={2100} placeholder="Model year" value={form.modelYear} onChange={(e) => setForm((f) => ({ ...f, modelYear: e.target.value }))} className={inputClass} />
          <input placeholder="Fuel" value={form.fuel} onChange={(e) => setForm((f) => ({ ...f, fuel: e.target.value }))} className={inputClass} />
          <input placeholder="Transmission" value={form.transmission} onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))} className={inputClass} />
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
                    <td className="px-4 py-3 font-medium text-fog">
                      {row.make}
                      {row.deleted ? (
                        <span className="ml-2 inline-flex rounded-full bg-flare-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-flare">
                          Deleted
                        </span>
                      ) : null}
                    </td>
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
                        <button type="button" disabled={row.deleted} onClick={() => removeCar(row)} className="rounded-lg p-2 text-mist hover:bg-flare-muted hover:text-flare disabled:opacity-40" title="Delete">
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
        <div className="fixed inset-0 z-[90] flex justify-end bg-ink/70 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-lg flex-col border-l border-steel/60 bg-slate shadow-2xl">
            <div className="flex items-center justify-between border-b border-steel/50 px-4 py-3">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-fog">Edit car</h2>
              <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-steel/60 p-2 text-fog hover:bg-steel/30">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submitEdit} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <input required placeholder="Brand" value={editForm.make} onChange={(e) => setEditForm((f) => ({ ...f, make: e.target.value }))} className={inputClass} />
              <input required placeholder="Model" value={editForm.model} onChange={(e) => setEditForm((f) => ({ ...f, model: e.target.value }))} className={inputClass} />
              <input placeholder="Variant" value={editForm.variant} onChange={(e) => setEditForm((f) => ({ ...f, variant: e.target.value }))} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min={1900} max={2100} placeholder="Model year" value={editForm.modelYear} onChange={(e) => setEditForm((f) => ({ ...f, modelYear: e.target.value }))} className={inputClass} />
                <input type="number" min={0} placeholder="Engine CC" value={editForm.engineCc} onChange={(e) => setEditForm((f) => ({ ...f, engineCc: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Fuel" value={editForm.fuel} onChange={(e) => setEditForm((f) => ({ ...f, fuel: e.target.value }))} className={inputClass} />
                <input placeholder="Transmission" value={editForm.transmission} onChange={(e) => setEditForm((f) => ({ ...f, transmission: e.target.value }))} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-steel/70 px-3 py-2 text-sm text-fog">
                <input type="checkbox" checked={editForm.published} onChange={(e) => setEditForm((f) => ({ ...f, published: e.target.checked }))} />
                Published
              </label>
              <textarea rows={3} placeholder="Notes (optional)" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} className={`${inputClass} resize-y`} />
              <div className="rounded-xl border border-steel/50 bg-ink/20 p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Photo (optional)</p>
                <input type="file" accept="image/*" onChange={onEditPhotoPick} className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-on-accent" />
                {editPhoto ? <img src={editPhoto} alt="Edited preview" className="mt-2 h-20 w-28 rounded-lg border border-steel/60 object-cover" /> : null}
                {!editPhoto && editExistingPhoto && !clearEditPhoto ? (
                  <img src={editExistingPhoto} alt="Current" className="mt-2 h-20 w-28 rounded-lg border border-steel/60 object-cover" />
                ) : null}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-mist">
                  <input type="checkbox" checked={clearEditPhoto} onChange={(e) => setClearEditPhoto(e.target.checked)} />
                  Remove existing photo
                </label>
              </div>
              <div className="rounded-xl border border-steel/50 bg-ink/20 p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Brand logo (optional)</p>
                <input type="file" accept="image/*" onChange={onEditBrandLogoPick} className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-hud file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-white" />
                {editBrandLogo ? <img src={editBrandLogo} alt="Edited brand logo preview" className="mt-2 h-16 w-16 rounded-lg border border-steel/60 object-cover" /> : null}
                {!editBrandLogo && editExistingBrandLogo && !clearEditBrandLogo ? (
                  <img src={editExistingBrandLogo} alt="Current brand logo" className="mt-2 h-16 w-16 rounded-lg border border-steel/60 object-cover" />
                ) : null}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-mist">
                  <input type="checkbox" checked={clearEditBrandLogo} onChange={(e) => setClearEditBrandLogo(e.target.checked)} />
                  Remove existing brand logo
                </label>
              </div>
              <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-accent disabled:opacity-50">
                <Save className="h-4 w-4" />
                {busy ? 'Saving…' : 'Save car'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
