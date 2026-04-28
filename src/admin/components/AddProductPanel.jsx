import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { PART_IMAGE_KEYS, PART_IMAGES } from '../../content/partImages.js'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'
import { VehicleMultiSelect } from './VehicleMultiSelect.jsx'

const MAX_RAW_FILE = 12 * 1024 * 1024

export function AddProductPanel({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [cars, setCars] = useState([])
  const [selectedCarIds, setSelectedCarIds] = useState([])
  const [catLoading, setCatLoading] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [actualPrice, setActualPrice] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [discountedPrice, setDiscountedPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [imageKey, setImageKey] = useState('brakes')
  const [primaryUploadDataUrl, setPrimaryUploadDataUrl] = useState('')
  const [primaryBusy, setPrimaryBusy] = useState(false)
  const [extraPhotos, setExtraPhotos] = useState([])
  const [extrasBusy, setExtrasBusy] = useState(false)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const loadCategories = useCallback(async () => {
    setCatLoading(true)
    try {
      const list = await adminService.listCategories()
      setCategories(list)
      setCategoryName((prev) => (prev.trim() ? prev : list[0]?.name || ''))
    } catch {
      setCategories([])
    } finally {
      setCatLoading(false)
    }
  }, [])

  const loadCars = useCallback(async () => {
    try {
      const list = await adminService.listCars()
      setCars(Array.isArray(list) ? list : [])
    } catch {
      setCars([])
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadCategories()
      loadCars()
    }
  }, [open, loadCategories, loadCars])

  async function onPickPrimaryFile(ev) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f || !f.type.startsWith('image/')) return
    if (f.size > MAX_RAW_FILE) {
      setMsg({ type: 'err', text: 'Image too large before compression (max 12MB file).' })
      return
    }
    setPrimaryBusy(true)
    setMsg(null)
    try {
      const dataUrl = await imageFileToCompressedDataUrl(f)
      setPrimaryUploadDataUrl(dataUrl)
      setMsg({ type: 'ok', text: 'Primary image compressed and ready to save.' })
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || 'Could not process image.' })
    } finally {
      setPrimaryBusy(false)
    }
  }

  async function onPickExtraFiles(ev) {
    const files = ev.target.files ? Array.from(ev.target.files) : []
    ev.target.value = ''
    if (!files.length) return
    const bad = files.find((f) => !f.type.startsWith('image/'))
    if (bad) {
      setMsg({ type: 'err', text: 'Only image files are allowed.' })
      return
    }
    const big = files.find((f) => f.size > MAX_RAW_FILE)
    if (big) {
      setMsg({ type: 'err', text: `“${big.name}” is too large (max 12MB per file).` })
      return
    }
    setExtrasBusy(true)
    setMsg(null)
    try {
      const next = []
      for (const f of files) {
        const dataUrl = await imageFileToCompressedDataUrl(f)
        next.push({
          id: crypto.randomUUID(),
          dataUrl,
          fileName: f.name,
        })
      }
      setExtraPhotos((prev) => [...prev, ...next])
      setMsg({ type: 'ok', text: `Added ${next.length} photo(s).` })
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || 'Could not process images.' })
    } finally {
      setExtrasBusy(false)
    }
  }

  function removeExtra(id) {
    setExtraPhotos((prev) => prev.filter((x) => x.id !== id))
  }

  function clearPrimaryUpload() {
    setPrimaryUploadDataUrl('')
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const cat = categoryName.trim()
    if (!cat) {
      setMsg({ type: 'err', text: 'Choose a category.' })
      setBusy(false)
      return
    }
    const uploadedPrimary = primaryUploadDataUrl.trim()
    const fromFiles = extraPhotos.map((x, i) => ({
      src: x.dataUrl,
      alt: x.fileName || `Photo ${i + 1}`,
    }))
    let primaryImageUrl = uploadedPrimary
    let galleryExtras = []

    if (!primaryImageUrl && fromFiles.length > 0) {
      primaryImageUrl = fromFiles[0].src
      galleryExtras = [...fromFiles.slice(1)]
    } else {
      galleryExtras = [...fromFiles]
    }

    const body = {
      type: 'part',
      category: cat,
      sku: sku.trim() || undefined,
      name: name.trim(),
      price: Number(actualPrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      totalStock: Number(stock) || 1,
      published: true,
      imageKey: imageKey || 'brakes',
      compatibleCarIds: selectedCarIds,
    }
    if (discountedPrice.trim()) body.discountedPrice = Number(discountedPrice) || 0
    if (description.trim()) body.description = description.trim()
    if (primaryImageUrl) body.primaryImageUrl = primaryImageUrl
    if (galleryExtras.length) body.galleryExtras = galleryExtras

    try {
      const product = await adminService.createProduct(body)
      if (product) {
        onCreated?.(product)
        setSku('')
        setName('')
        setActualPrice('')
        setPurchasePrice('')
        setDiscountedPrice('')
        setStock('1')
        setPrimaryUploadDataUrl('')
        setExtraPhotos([])
        setDescription('')
        setSelectedCarIds([])
        setMsg({ type: 'ok', text: `Product “${product.name}” created.` })
      }
    } catch (err) {
      setMsg({ type: 'err', text: getFetchErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full border border-steel/80 bg-ink/40 px-3 py-2 font-sans text-sm text-fog outline-none focus:border-accent/60'

  return (
    <section className="admin-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-display text-lg font-bold uppercase tracking-tight text-fog md:px-5 md:py-4"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-accent" strokeWidth={2} />
          Add product
        </span>
        {open ? <ChevronUp className="h-5 w-5 text-mist" /> : <ChevronDown className="h-5 w-5 text-mist" />}
      </button>

      {open && (
        <div className="border-t border-steel/50 px-4 pb-5 pt-2 md:px-5">
          {msg && (
            <p
              className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                msg.type === 'ok'
                  ? 'border-accent/40 bg-accent-muted text-fog'
                  : 'border-flare/40 bg-flare-muted text-fog'
              }`}
            >
              {msg.text}
            </p>
          )}

          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                Category
              </label>
              <select required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} disabled={busy || catLoading} className={inputClass}>
                <option value="">{catLoading ? 'Loading catalog…' : 'Select category'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Product name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">SKU (optional)</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} placeholder="Auto if empty" />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Actual price (INR)</label>
              <input required type="number" min={0} value={actualPrice} onChange={(e) => setActualPrice(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Purchase price (INR)</label>
              <input required type="number" min={0} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Discounted price (INR)</label>
              <input type="number" min={0} value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} className={inputClass} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Stock</label>
              <input required type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Preset thumbnail key</label>
              <select value={imageKey} onChange={(e) => setImageKey(e.target.value)} className={inputClass}>
                {PART_IMAGE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k} — {PART_IMAGES[k]?.alt?.slice(0, 48) ?? k}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 rounded-xl border border-steel/50 bg-ink/20 p-4">
              <label className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-hud">
                <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
                Upload primary image (JPEG, auto-resized)
              </label>
              <input
                type="file"
                accept="image/*"
                disabled={primaryBusy || busy}
                onChange={onPickPrimaryFile}
                className="font-sans text-sm text-mist file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-semibold file:uppercase file:text-on-accent disabled:opacity-50"
              />
              {primaryBusy && <p className="mt-2 font-mono text-[10px] text-mist">Compressing…</p>}
              {primaryUploadDataUrl && (
                <div className="mt-3 flex flex-wrap items-start gap-3">
                  <img
                    src={primaryUploadDataUrl}
                    alt="Primary preview"
                    className="h-24 w-24 rounded-lg border border-steel/60 object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearPrimaryUpload}
                    className="inline-flex items-center gap-1 rounded-lg border border-steel/60 px-2 py-1 font-mono text-[10px] uppercase text-mist hover:border-flare/50 hover:text-flare"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove upload
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2 rounded-xl border border-steel/50 bg-ink/20 p-4">
              <label className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-hud">
                <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
                More photos (gallery) — select multiple files
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={extrasBusy || busy}
                onChange={onPickExtraFiles}
                className="font-sans text-sm text-mist file:mr-3 file:rounded-lg file:border-0 file:bg-hud file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-semibold file:uppercase file:text-white disabled:opacity-50"
              />
              {extrasBusy && <p className="mt-2 font-mono text-[10px] text-mist">Compressing…</p>}
              {extraPhotos.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {extraPhotos.map((p) => (
                    <li key={p.id} className="relative">
                      <img
                        src={p.dataUrl}
                        alt=""
                        className="h-20 w-20 rounded-lg border border-steel/60 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExtra(p.id)}
                        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-steel/80 bg-ink text-mist hover:bg-flare-muted hover:text-flare"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 font-mono text-[9px] leading-relaxed text-mist">
                If you only add gallery files and no primary upload, the first gallery file becomes the main catalog
                image. Others show in the product gallery.
              </p>
            </div>

            <div className="md:col-span-2">
              <VehicleMultiSelect
                cars={cars}
                selectedCarIds={selectedCarIds}
                onChange={setSelectedCarIds}
                label="Compatible vehicles (select multiple)"
                emptyText="No DB cars available."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-accent px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-accent shadow-md transition-[filter] hover:brightness-95 disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Create product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
