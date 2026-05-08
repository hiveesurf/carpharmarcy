import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { PART_IMAGE_KEYS, PART_IMAGES } from '../../content/partImages.js'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'

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
  const [partNumber, setPartNumber] = useState('')
  const [brand, setBrand] = useState('')
  const [unitVolume, setUnitVolume] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [openingStock, setOpeningStock] = useState('0')
  const [stockIn, setStockIn] = useState('0')
  const [stockOut, setStockOut] = useState('0')
  const [imageKey, setImageKey] = useState('brakes')
  const [primaryUploadDataUrl, setPrimaryUploadDataUrl] = useState('')
  const [primaryBusy, setPrimaryBusy] = useState(false)
  const [extraPhotos, setExtraPhotos] = useState([])
  const [extrasBusy, setExtrasBusy] = useState(false)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [vehicleVariant, setVehicleVariant] = useState('')
  const [vehicleFuel, setVehicleFuel] = useState('')
  const [vehicleError, setVehicleError] = useState('')
  const [carFormOpen, setCarFormOpen] = useState(false)
  const [carBusy, setCarBusy] = useState(false)
  const [carMsg, setCarMsg] = useState(null)
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    variant: '',
    modelYear: '',
    fuel: '',
    transmission: '',
    engineCc: '',
    notes: '',
    published: true,
  })

  const inputClass =
    'w-full border border-steel/80 bg-ink/40 px-3 py-2 font-sans text-sm text-fog outline-none focus:border-accent/60'

  const sectionTitleClass = 'font-display text-xs font-bold uppercase tracking-wide text-fog'
  const labelClass = 'mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud'

  const opening = useMemo(() => Math.max(0, Number(openingStock) || 0), [openingStock])
  const inQty = useMemo(() => Math.max(0, Number(stockIn) || 0), [stockIn])
  const outQty = useMemo(() => Math.max(0, Number(stockOut) || 0), [stockOut])
  const currentStock = useMemo(() => opening + inQty - outQty, [opening, inQty, outQty])
  const selectedCars = useMemo(() => {
    if (!Array.isArray(cars) || cars.length === 0 || selectedCarIds.length === 0) return []
    const selected = new Set(selectedCarIds.map((id) => String(id)))
    return cars.filter((car) => selected.has(String(car?.id ?? '')))
  }, [cars, selectedCarIds])
  const uniqueSorted = useCallback((values) => {
    return [...new Set(values.filter((v) => v != null && String(v).trim() !== '').map((v) => String(v).trim()))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [])
  const makeOptions = useMemo(() => uniqueSorted(cars.map((car) => car.make)), [cars, uniqueSorted])
  const carsByMake = useMemo(() => (vehicleMake ? cars.filter((car) => String(car.make || '').trim() === vehicleMake) : []), [cars, vehicleMake])
  const modelOptions = useMemo(() => uniqueSorted(carsByMake.map((car) => car.model)), [carsByMake, uniqueSorted])
  const carsByMakeModel = useMemo(() => {
    if (!vehicleMake || !vehicleModel) return []
    return cars.filter((car) => String(car.make || '').trim() === vehicleMake && String(car.model || '').trim() === vehicleModel)
  }, [cars, vehicleMake, vehicleModel])
  const yearOptions = useMemo(() => uniqueSorted(carsByMakeModel.map((car) => car.modelYear)), [carsByMakeModel, uniqueSorted])
  const variantOptions = useMemo(() => uniqueSorted(carsByMakeModel.map((car) => car.variant)), [carsByMakeModel, uniqueSorted])
  const fuelOptions = useMemo(() => uniqueSorted(carsByMakeModel.map((car) => car.fuel)), [carsByMakeModel, uniqueSorted])

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
      const activeCars = Array.isArray(list)
        ? list.filter((car) => {
            const status = String(car?.status || '').trim().toLowerCase()
            return !(
              car?.deleted === true ||
              car?.isDeleted === true ||
              Boolean(car?.deletedAt) ||
              status === 'deleted'
            )
          })
        : []
      setCars(activeCars)
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

  useEffect(() => {
    if (!msg?.text) return undefined
    const timeoutMs = msg.type === 'ok' ? 4000 : 7000
    const timer = window.setTimeout(() => {
      setMsg(null)
    }, timeoutMs)
    return () => window.clearTimeout(timer)
  }, [msg])

  useEffect(() => {
    if (!carMsg?.text) return undefined
    const timeoutMs = carMsg.type === 'ok' ? 4000 : 7000
    const timer = window.setTimeout(() => {
      setCarMsg(null)
    }, timeoutMs)
    return () => window.clearTimeout(timer)
  }, [carMsg])

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

  function resetFormAfterCreate() {
    setSku('')
    setName('')
    setPartNumber('')
    setBrand('')
    setUnitVolume('')
    setSupplierName('')
    setPurchasePrice('')
    setSellingPrice('')
    setOpeningStock('0')
    setStockIn('0')
    setStockOut('0')
    setImageKey('brakes')
    setPrimaryUploadDataUrl('')
    setExtraPhotos([])
    setDescription('')
    setSelectedCarIds([])
    setVehicleMake('')
    setVehicleModel('')
    setVehicleYear('')
    setVehicleVariant('')
    setVehicleFuel('')
    setVehicleError('')
  }

  function onNonNegativeNumber(setter) {
    return (e) => {
      const next = e.target.value
      if (next === '') {
        setter('')
        return
      }
      const n = Number(next)
      if (Number.isNaN(n)) return
      setter(String(Math.max(0, n)))
    }
  }

  function onVehicleMakeChange(nextMake) {
    setVehicleMake(nextMake)
    setVehicleModel('')
    setVehicleYear('')
    setVehicleVariant('')
    setVehicleFuel('')
    setVehicleError('')
  }

  function onVehicleModelChange(nextModel) {
    setVehicleModel(nextModel)
    setVehicleYear('')
    setVehicleVariant('')
    setVehicleFuel('')
    setVehicleError('')
  }

  function addVehicleSelection() {
    setVehicleError('')
    if (!vehicleMake || !vehicleModel) {
      setVehicleError('Select at least Vehicle Make and Vehicle Model.')
      return
    }
    const matches = cars.filter((car) => {
      if (String(car.make || '').trim() !== vehicleMake) return false
      if (String(car.model || '').trim() !== vehicleModel) return false
      if (vehicleYear && String(car.modelYear ?? '').trim() !== vehicleYear) return false
      if (vehicleVariant && String(car.variant || '').trim() !== vehicleVariant) return false
      if (vehicleFuel && String(car.fuel || '').trim() !== vehicleFuel) return false
      return true
    })
    const picked = matches[0]
    if (!picked) {
      setVehicleError('No matching car found for the selected combination.')
      return
    }
    const pickedId = String(picked.id)
    if (selectedCarIds.includes(pickedId)) {
      setVehicleError('This vehicle is already selected.')
      return
    }
    setSelectedCarIds((prev) => [...prev, pickedId])
  }

  function removeSelectedVehicle(id) {
    setSelectedCarIds((prev) => prev.filter((x) => x !== id))
  }

  function resetNewCarForm() {
    setNewCar({
      make: '',
      model: '',
      variant: '',
      modelYear: '',
      fuel: '',
      transmission: '',
      engineCc: '',
      notes: '',
      published: true,
    })
  }

  async function submitNewCar(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const make = newCar.make.trim()
    const model = newCar.model.trim()
    if (!make || !model) {
      setCarMsg({ type: 'err', text: 'Brand and model are required to create a car.' })
      return
    }

    setCarBusy(true)
    setCarMsg(null)
    setVehicleError('')
    try {
      const createdCar = await adminService.createCar({
        brandName: make,
        make,
        model,
        variant: newCar.variant.trim() || null,
        modelYear: newCar.modelYear ? Number(newCar.modelYear) : null,
        fuel: newCar.fuel.trim() || null,
        transmission: newCar.transmission.trim() || null,
        engineCc: newCar.engineCc ? Number(newCar.engineCc) : null,
        notes: newCar.notes.trim() || null,
        published: Boolean(newCar.published),
      })

      const createdId = createdCar?.id != null ? String(createdCar.id) : ''
      if (!createdId) {
        throw new Error('Could not identify created car id.')
      }

      setCars((prev) => {
        const nextCar = { ...createdCar, id: createdId }
        const filtered = prev.filter((car) => String(car?.id ?? '') !== createdId)
        return [nextCar, ...filtered]
      })
      setSelectedCarIds((prev) => (prev.includes(createdId) ? prev : [...prev, createdId]))

      await loadCars()
      setCarFormOpen(false)
      resetNewCarForm()
      setCarMsg({ type: 'ok', text: 'Car created and selected successfully.' })
    } catch (err) {
      setCarMsg({ type: 'err', text: getFetchErrorMessage(err) })
    } finally {
      setCarBusy(false)
    }
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

    if (currentStock < 0) {
      setMsg({ type: 'err', text: 'Current stock cannot be negative. Increase opening/stock in or reduce stock out.' })
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
      sku: sku.trim(),
      name: name.trim(),
      partNumber: partNumber.trim(),
      brand: brand.trim(),
      unitVolume: unitVolume.trim(),
      supplierName: supplierName.trim(),
      price: Number(sellingPrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      totalStock: currentStock,
      published: true,
      imageKey: imageKey || 'brakes',
      compatibleCarIds: selectedCarIds,
      metadata: {
        openingStock: opening,
        stockIn: inQty,
        stockOut: outQty,
      },
    }
    if (description.trim()) body.description = description.trim()
    if (primaryImageUrl) body.primaryImageUrl = primaryImageUrl
    if (galleryExtras.length) body.galleryExtras = galleryExtras

    try {
      console.log('Add Product payload:', body)
      const product = await adminService.createProduct(body)
      if (product) {
        onCreated?.(product)
        resetFormAfterCreate()
        setMsg({ type: 'ok', text: `Product “${product.name}” created.` })
      }
    } catch (err) {
      setMsg({ type: 'err', text: getFetchErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

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

          <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-1">
                <label className={labelClass}>Category</label>
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
                <label className={labelClass}>SKU</label>
                <input required value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Part Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Part Number</label>
                <input required value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Brand</label>
                <input required value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Unit/Volume</label>
                <input required value={unitVolume} onChange={(e) => setUnitVolume(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Supplier Name</label>
                <input required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Purchase Price</label>
                <input required type="number" min={0} step="1" value={purchasePrice} onChange={onNonNegativeNumber(setPurchasePrice)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Selling Price (INR)</label>
                <input required type="number" min={0} step="1" value={sellingPrice} onChange={onNonNegativeNumber(setSellingPrice)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Opening Stock</label>
                <input required type="number" min={0} step="1" value={openingStock} onChange={onNonNegativeNumber(setOpeningStock)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Stock In</label>
                <input required type="number" min={0} step="1" value={stockIn} onChange={onNonNegativeNumber(setStockIn)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Stock Out</label>
                <input required type="number" min={0} step="1" value={stockOut} onChange={onNonNegativeNumber(setStockOut)} className={inputClass} />
              </div>
              <div>
                <label className={`${labelClass} text-accent`}>Current Stock</label>
                <input readOnly value={currentStock} className={`${inputClass} border-accent/40 bg-accent-muted/30 font-semibold text-accent`} />
              </div>
              <div>
                <label className={labelClass}>Preset Thumbnail Key</label>
                <select value={imageKey} onChange={(e) => setImageKey(e.target.value)} className={inputClass}>
                  {PART_IMAGE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k} — {PART_IMAGES[k]?.alt?.slice(0, 48) ?? k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-steel/50 bg-ink/10 p-3">
              <div className="flex items-center justify-between">
                <h3 className={sectionTitleClass}>Vehicle Compatibility</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
                  {selectedCars.length} selected
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className={labelClass}>Vehicle Make</label>
                  <select value={vehicleMake} onChange={(e) => onVehicleMakeChange(e.target.value)} className={inputClass}>
                    <option value="">Select make</option>
                    {makeOptions.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Vehicle Model</label>
                  <select value={vehicleModel} onChange={(e) => onVehicleModelChange(e.target.value)} disabled={!vehicleMake} className={inputClass}>
                    <option value="">{vehicleMake ? 'Select model' : 'Choose make first'}</option>
                    {modelOptions.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Year</label>
                  <select value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} disabled={!vehicleModel} className={inputClass}>
                    <option value="">{vehicleModel ? 'Any year' : 'Choose model first'}</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Vehicle Variant</label>
                  <select value={vehicleVariant} onChange={(e) => setVehicleVariant(e.target.value)} disabled={!vehicleModel} className={inputClass}>
                    <option value="">{vehicleModel ? 'Any variant' : 'Choose model first'}</option>
                    {variantOptions.map((variant) => (
                      <option key={variant} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Vehicle Fuel</label>
                  <select value={vehicleFuel} onChange={(e) => setVehicleFuel(e.target.value)} disabled={!vehicleModel} className={inputClass}>
                    <option value="">{vehicleModel ? 'Any fuel' : 'Choose model first'}</option>
                    {fuelOptions.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCarFormOpen((v) => !v)
                    setCarMsg(null)
                    setVehicleError('')
                  }}
                  className="mr-2 rounded-lg border border-steel/70 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-hud/60 hover:text-hud"
                >
                  {carFormOpen ? 'Cancel New Car' : 'Add New Car'}
                </button>
                <button
                  type="button"
                  onClick={addVehicleSelection}
                  className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-accent hover:bg-accent/20"
                >
                  Add Vehicle
                </button>
              </div>
              {carFormOpen ? (
                <div
                  className="space-y-3 rounded-lg border border-steel/40 bg-ink/20 p-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.stopPropagation()
                    }
                  }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-hud">
                    Create car inline
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input
                      required
                      placeholder="Brand"
                      value={newCar.make}
                      onChange={(e) => setNewCar((prev) => ({ ...prev, make: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      required
                      placeholder="Model"
                      value={newCar.model}
                      onChange={(e) => setNewCar((prev) => ({ ...prev, model: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      placeholder="Variant"
                      value={newCar.variant}
                      onChange={(e) => setNewCar((prev) => ({ ...prev, variant: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min={1900}
                      max={2100}
                      placeholder="Model year"
                      value={newCar.modelYear}
                      onChange={(e) => setNewCar((prev) => ({ ...prev, modelYear: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      placeholder="Fuel"
                      value={newCar.fuel}
                      onChange={(e) => setNewCar((prev) => ({ ...prev, fuel: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      placeholder="Transmission"
                      value={newCar.transmission}
                      onChange={(e) => setNewCar((prev) => ({ ...prev, transmission: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Engine CC"
                      value={newCar.engineCc}
                      onChange={(e) => setNewCar((prev) => ({ ...prev, engineCc: e.target.value }))}
                      className={inputClass}
                    />
                    <label className="flex items-center gap-2 rounded-xl border border-steel/70 px-3 py-2 text-xs text-fog">
                      <input
                        type="checkbox"
                        checked={newCar.published}
                        onChange={(e) => setNewCar((prev) => ({ ...prev, published: e.target.checked }))}
                      />
                      Published
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Notes (optional)"
                    value={newCar.notes}
                    onChange={(e) => setNewCar((prev) => ({ ...prev, notes: e.target.value }))}
                    className={`${inputClass} resize-y`}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCarFormOpen(false)
                        setCarMsg(null)
                        resetNewCarForm()
                      }}
                      className="rounded-lg border border-steel/70 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-steel/40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={carBusy}
                      onClick={(e) => {
                        void submitNewCar(e)
                      }}
                      className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-accent hover:bg-accent/20 disabled:opacity-50"
                    >
                      {carBusy ? 'Creating…' : 'Create and Select Car'}
                    </button>
                  </div>
                </div>
              ) : null}
              {carMsg ? (
                <p
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    carMsg.type === 'ok'
                      ? 'border-accent/40 bg-accent-muted text-fog'
                      : 'border-flare/40 bg-flare-muted text-fog'
                  }`}
                >
                  {carMsg.text}
                </p>
              ) : null}
              {vehicleError ? <p className="text-xs text-flare">{vehicleError}</p> : null}
              <div className="overflow-x-auto rounded-lg border border-steel/40">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="border-b border-steel/40 font-mono uppercase tracking-wider text-mist">
                    <tr>
                      <th className="px-2 py-2">Vehicle Make</th>
                      <th className="px-2 py-2">Vehicle Model</th>
                      <th className="px-2 py-2">Year</th>
                      <th className="px-2 py-2">Vehicle Variant</th>
                      <th className="px-2 py-2">Vehicle Fuel</th>
                      <th className="px-2 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel/30 text-fog">
                    {selectedCars.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-3 text-mist">
                          No vehicles selected yet.
                        </td>
                      </tr>
                    ) : (
                      selectedCars.map((car) => (
                        <tr key={car.id}>
                          <td className="px-2 py-2">{car.make || '—'}</td>
                          <td className="px-2 py-2">{car.model || '—'}</td>
                          <td className="px-2 py-2">{car.modelYear ?? '—'}</td>
                          <td className="px-2 py-2">{car.variant || '—'}</td>
                          <td className="px-2 py-2">{car.fuel || '—'}</td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeSelectedVehicle(car.id)}
                              className="rounded-md border border-steel/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-mist hover:border-flare/40 hover:text-flare"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-steel/50 bg-ink/20 p-3">
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
                <div className="mt-2 flex flex-wrap items-start gap-2">
                  <img
                    src={primaryUploadDataUrl}
                    alt="Primary preview"
                    className="h-16 w-16 rounded-lg border border-steel/60 object-cover"
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

            <div className="rounded-xl border border-steel/50 bg-ink/20 p-3">
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
                <ul className="mt-2 flex flex-wrap gap-2">
                  {extraPhotos.map((p) => (
                    <li key={p.id} className="relative">
                      <img
                        src={p.dataUrl}
                        alt=""
                        className="h-16 w-16 rounded-lg border border-steel/60 object-cover"
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

            <div>
              <label className={labelClass}>Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </div>

            {currentStock < 0 ? (
              <p className="text-xs text-flare">Current stock cannot be negative.</p>
            ) : null}

            <div className="flex justify-end">
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
