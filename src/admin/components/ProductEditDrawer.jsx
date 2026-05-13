import { useCallback, useEffect, useState } from 'react'
import { X, Save, ImagePlus, Trash2, Eye, EyeOff } from 'lucide-react'
import { PART_IMAGE_KEYS, PART_IMAGES } from '../../content/partImages.js'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'
import { VehicleMultiSelect } from './VehicleMultiSelect.jsx'
import { resolveApiAssetUrl } from '../../lib/resolveApiAssetUrl.js'

const MAX_RAW = 12 * 1024 * 1024

/** Normalizes `product.metadata` to a plain object (API may send object or JSON string). */
function metadataFromProduct(product) {
  if (!product || typeof product !== 'object') return {}
  const raw = product.metadata
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...raw }
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...parsed } : {}
    } catch {
      return {}
    }
  }
  return {}
}

function galleryFromProduct(p) {
  const g = p?.gallery
  if (!Array.isArray(g)) return []
  const out = []
  let i = 0
  for (const item of g) {
    const src = item && typeof item === 'object' ? item.src : String(item ?? '')
    if (!src) continue
    const alt = item && typeof item === 'object' && item.alt ? item.alt : `Image ${i + 1}`
    out.push({ id: `g-${i}-${src.slice(0, 20)}`, src, alt })
    i++
  }
  return out
}

export function ProductEditDrawer({ productId, categories, onClose, onSaved }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [p, setP] = useState(null)
  const [err, setErr] = useState(null)

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [actualPrice, setActualPrice] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [stock, setStock] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [imageKey, setImageKey] = useState('brakes')
  const [description, setDescription] = useState('')
  const [published, setPublished] = useState(true)
  const [primaryUpload, setPrimaryUpload] = useState('')
  const [removePrimaryImage, setRemovePrimaryImage] = useState(false)
  const [primaryBusy, setPrimaryBusy] = useState(false)
  const [galleryItems, setGalleryItems] = useState([])
  const [extrasBusy, setExtrasBusy] = useState(false)
  const [cars, setCars] = useState([])
  const [selectedCarIds, setSelectedCarIds] = useState([])
  const [auditRows, setAuditRows] = useState([])
  const [brand, setBrand] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [unitVolume, setUnitVolume] = useState('')
  const [supplierName, setSupplierName] = useState('')

  const load = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    setErr(null)
    try {
      const row = await adminService.getProduct(productId)
      if (!row) throw new Error('Product not found')
      setP(row)
    } catch (e) {
      setErr(getFetchErrorMessage(e))
      setP(null)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    adminService
      .listCars()
      .then((list) => setCars(Array.isArray(list) ? list : []))
      .catch(() => setCars([]))
  }, [])

  useEffect(() => {
    if (!productId) return
    adminService
      .listProductAudit(productId)
      .then((rows) => setAuditRows(Array.isArray(rows) ? rows : []))
      .catch(() => setAuditRows([]))
  }, [productId])

  useEffect(() => {
    if (!p) return
    const md = metadataFromProduct(p)
    setName(p.name ?? '')
    setSku(p.sku ?? '')
    setActualPrice(String(p.actualPrice ?? p.price ?? ''))
    setPurchasePrice(String(p.purchasePrice ?? '0'))
    setStock(String(p.totalStock ?? '0'))
    setCategoryName(p.category ?? '')
    setImageKey(p.imageKey && PART_IMAGE_KEYS.includes(p.imageKey) ? p.imageKey : 'brakes')
    setDescription(typeof p.description === 'string' ? p.description : '')
    setSelectedCarIds(Array.isArray(p.compatibleCarIds) ? p.compatibleCarIds : [])
    setPublished(!!p.published)
    setPrimaryUpload('')
    setRemovePrimaryImage(false)
    setGalleryItems(galleryFromProduct(p))
    setBrand(String(p.brand ?? md.brand ?? ''))
    setPartNumber(String(p.partNumber ?? md.partNumber ?? ''))
    setUnitVolume(String(p.unitVolume ?? md.unitVolume ?? ''))
    setSupplierName(String(p.supplierName ?? md.supplierName ?? ''))
  }, [p])

  async function onPrimaryFile(ev) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f?.type.startsWith('image/') || f.size > MAX_RAW) return
    setPrimaryBusy(true)
    try {
      setPrimaryUpload(await imageFileToCompressedDataUrl(f))
      setRemovePrimaryImage(false)
    } finally {
      setPrimaryBusy(false)
    }
  }

  async function onGalleryFiles(ev) {
    const files = ev.target.files ? Array.from(ev.target.files) : []
    ev.target.value = ''
    if (!files.length) return
    setExtrasBusy(true)
    try {
      const next = []
      for (const f of files) {
        if (!f.type.startsWith('image/') || f.size > MAX_RAW) continue
        const dataUrl = await imageFileToCompressedDataUrl(f)
        next.push({ id: crypto.randomUUID(), src: dataUrl, alt: f.name })
      }
      setGalleryItems((prev) => [...prev, ...next])
    } finally {
      setExtrasBusy(false)
    }
  }

  function removeGalleryItem(id) {
    setGalleryItems((prev) => prev.filter((x) => x.id !== id))
  }

  function removeCurrentPrimaryImage() {
    setPrimaryUpload('')
    setRemovePrimaryImage(true)
  }

  async function togglePublishQuick() {
    if (!p) return
    const next = !published
    setSaving(true)
    setErr(null)
    try {
      const updated = await adminService.publishProduct(p.id, next)
      if (updated) {
        setPublished(!!updated.published)
        setP((prev) => (prev ? { ...prev, ...updated } : prev))
        onSaved?.(updated)
      }
    } catch (e) {
      setErr(getFetchErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function saveAll(e) {
    e.preventDefault()
    if (!p || p.type !== 'part') return
    const cat = categoryName.trim()
    if (!cat) {
      setErr('Category is required.')
      return
    }
    setSaving(true)
    setErr(null)
    const primary = primaryUpload.trim()
    const galleryExtras = galleryItems.filter((x) => x.src).map((x, i) => ({ src: x.src, alt: x.alt || `Photo ${i + 1}` }))

    const body = {
      type: 'part',
      category: cat,
      sku: sku.trim(),
      name: name.trim(),
      price: Number(actualPrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      totalStock: Number(stock) || 0,
      published,
      imageKey: imageKey || 'brakes',
      compatibleCarIds: selectedCarIds,
      galleryExtras,
      brand: brand.trim(),
      partNumber: partNumber.trim(),
      unitVolume: unitVolume.trim(),
      supplierName: supplierName.trim(),
    }
    if (primary) body.primaryImageUrl = primary
    else if (removePrimaryImage) body.primaryImageUrl = ''
    if (description.trim()) body.description = description.trim()

    const payload = body

    try {
      const updated = await adminService.updateProduct(p.id, payload)
      if (updated) {
        onSaved?.(updated)
        setP(updated)
        setErr(null)
      }
    } catch (e) {
      setErr(getFetchErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full border border-steel/80 bg-ink/40 px-3 py-2 font-sans text-sm text-fog outline-none focus:border-accent/60'

  if (!productId) return null

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-ink/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-steel/60 bg-slate shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-steel/50 px-4 py-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-fog">Edit product</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-steel/60 text-fog hover:bg-steel/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading && <p className="font-mono text-xs text-mist">Loading…</p>}
          {err && (
            <div className="mb-4 rounded-xl border border-flare/40 bg-flare-muted px-3 py-2 text-sm text-fog">{err}</div>
          )}

          {!loading && p && p.type !== 'part' && (
            <p className="text-sm text-mist">Only part-type products can be edited in this form. (ID: {p.id})</p>
          )}

          {!loading && p && p.type === 'part' && (
            <form onSubmit={saveAll} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={saving || p.deleted}
                  onClick={togglePublishQuick}
                  className="inline-flex items-center gap-2 rounded-xl border border-accent/50 bg-accent/15 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent hover:bg-accent/25 disabled:opacity-50"
                >
                  {published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {published ? 'Unpublish' : 'Publish'} (DB)
                </button>
                <span className="font-mono text-[10px] text-mist">
                  {p.deleted ? 'Product is deleted' : published ? 'Visible in catalog' : 'Hidden from catalog'}
                </span>
              </div>
              {p.deleted ? (
                <p className="rounded-xl border border-flare/40 bg-flare-muted px-3 py-2 text-xs text-fog">
                  This product is soft deleted. Publishing and save actions are disabled.
                </p>
              ) : null}

              <label className="flex items-center gap-2 font-sans text-sm text-fog">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  disabled={p.deleted}
                />
                Published when saving
              </label>

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">SKU</label>
                <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Brand</label>
                  <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Part Number</label>
                  <input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Unit / Volume</label>
                  <input value={unitVolume} onChange={(e) => setUnitVolume(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Supplier Name</label>
                  <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Selling Price (INR)</label>
                  <input required type="number" min={0} value={actualPrice} onChange={(e) => setActualPrice(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Purchase price (INR)</label>
                  <input required type="number" min={0} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Stock</label>
                  <input required type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Category</label>
                <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className={inputClass}>
                  <option value="">Select category</option>
                  {Array.isArray(categories) &&
                    categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  {categoryName &&
                    !categories?.some((c) => c.name === categoryName) && (
                      <option value={categoryName}>{categoryName}</option>
                    )}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Preset image key</label>
                <select value={imageKey} onChange={(e) => setImageKey(e.target.value)} className={inputClass}>
                  {PART_IMAGE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-steel/50 bg-ink/20 p-3">
                <label className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-hud">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Replace primary (upload)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={primaryBusy || saving}
                  onChange={onPrimaryFile}
                  className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-2 file:py-1 file:font-mono file:text-[9px] file:text-on-accent"
                />
                {primaryUpload && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={primaryUpload} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <button type="button" onClick={() => setPrimaryUpload('')} className="text-[10px] text-flare">
                      Remove upload
                    </button>
                  </div>
                )}
                {!primaryUpload && p.image ? (
                  <div className="mt-2">
                    <div className="relative inline-block">
                      <img
                        src={resolveApiAssetUrl(p.image) ?? p.image}
                        alt=""
                        className="h-16 w-16 rounded-lg border border-steel/50 object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeCurrentPrimaryImage}
                        className="absolute -right-1 -top-1 rounded-full bg-ink p-0.5 text-flare"
                        aria-label="Remove primary image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="mt-1 block font-mono text-[10px] text-mist">Current image</span>
                  </div>
                ) : null}
                {removePrimaryImage ? (
                  <p className="mt-2 text-xs text-flare">Primary image will be removed on save.</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-steel/50 bg-ink/20 p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Gallery</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={extrasBusy || saving}
                  onChange={onGalleryFiles}
                  className="mb-2 text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-hud file:px-2 file:py-1 file:font-mono file:text-[9px] file:text-white"
                />
                <ul className="mt-2 flex flex-wrap gap-2">
                  {galleryItems.map((item) => (
                    <li key={item.id} className="relative">
                      <img
                        src={resolveApiAssetUrl(item.src) ?? item.src}
                        alt=""
                        className="h-16 w-16 rounded-lg border border-steel/50 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(item.id)}
                        className="absolute -right-1 -top-1 rounded-full bg-ink p-0.5 text-flare"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <VehicleMultiSelect
                  cars={cars}
                  selectedCarIds={selectedCarIds}
                  onChange={setSelectedCarIds}
                  label="Compatible vehicles (select multiple)"
                  emptyText="No DB cars."
                />
                {Array.isArray(p.fitmentLabelValues) && p.fitmentLabelValues.length > 0 ? (
                  <div className="rounded-xl border border-steel/50 bg-ink/20 p-3">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">
                      Imported / label fitment (Excel or free-text)
                    </p>
                    <p className="mb-2 text-[11px] leading-snug text-mist">
                      These values are stored as fitment labels. They are separate from catalog car links above.
                      Saving this form without editing the list below leaves them unchanged.
                    </p>
                    <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-[11px] text-fog">
                      {p.fitmentLabelValues.map((line, idx) => (
                        <li key={`${idx}-${String(line)}`} className="rounded border border-steel/40 bg-slate/30 px-2 py-1">
                          {String(line)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-y`} />
              </div>

              <div className="rounded-xl border border-steel/50 bg-ink/20 p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Change history</p>
                {auditRows.length === 0 ? (
                  <p className="text-xs text-mist">No audit events yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {auditRows.slice(0, 8).map((row) => (
                      <li key={row.id} className="text-xs text-mist">
                        <span className="uppercase text-fog">{row.action}</span> by {row.actorName || row.actorId || 'system'} ({row.actorRole}) at{' '}
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || p.deleted}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-accent disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save to database'}
                </button>
                <button type="button" onClick={onClose} className="rounded-xl border border-steel/60 px-4 py-2 text-sm text-mist">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
