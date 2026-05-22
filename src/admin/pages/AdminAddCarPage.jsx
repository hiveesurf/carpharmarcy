import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'
import { validateCarForm } from '../../lib/carFormValidation.js'

const MAX_RAW_FILE = 12 * 1024 * 1024

const canvasClass =
  '-mx-4 min-w-0 rounded-none bg-[#eaeded] px-4 py-5 dark:bg-ink/40 md:-mx-6 md:rounded-xl md:px-6 lg:-mx-0 lg:rounded-xl lg:px-8'

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

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-flare">{message}</p>
}

export function AdminAddCarPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [createPhoto, setCreatePhoto] = useState('')
  const [createBrandLogo, setCreateBrandLogo] = useState('')
  const [carFormOptions, setCarFormOptions] = useState({ fuels: [], transmissions: [] })

  const inputClass =
    'w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2.5 text-sm text-fog outline-none transition-colors focus:border-accent/60 admin-input'

  function fieldInputClass(hasError) {
    return hasError ? `${inputClass} border-flare/60` : inputClass
  }

  function clearFieldError(key) {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

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
      setErrors(validation.errors)
      return
    }
    setErrors({})
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
      navigate('/admin/cars', {
        replace: true,
        state: { success: true },
      })
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={canvasClass}>
      <div className="mx-auto max-w-[56rem] space-y-5">
        <Link
          to="/admin/cars"
          className="inline-flex items-center gap-2 rounded-xl border border-steel/70 bg-white px-4 py-2 text-sm font-medium text-mist shadow-sm transition-colors hover:border-accent/50 hover:text-accent dark:bg-slate"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cars
        </Link>

        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-[#0f1111] dark:text-fog md:text-3xl">
            Add car
          </h1>
          <p className="mt-1 text-sm text-[#565959] dark:text-mist">Add a new vehicle to the catalog</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog shadow-sm">
            {error}
          </div>
        ) : null}

        <section className="admin-card rounded-2xl p-6 shadow-sm sm:p-8">
          <div className="mb-6 border-b border-steel/40 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted text-accent ring-1 ring-accent/30">
                <Car className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-tight text-fog">Vehicle details</h2>
                <p className="text-xs text-mist">Required fields must be completed before saving</p>
              </div>
            </div>
          </div>

          <form onSubmit={submitCreate} className="grid gap-4 sm:grid-cols-2" noValidate>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Brand *</label>
              <input
                placeholder="Enter car brand"
                value={form.make}
                onChange={(e) => {
                  setForm((f) => ({ ...f, make: e.target.value }))
                  clearFieldError('make')
                }}
                className={fieldInputClass(errors.make)}
                aria-invalid={!!errors.make}
              />
              <FieldError message={errors.make} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Model *</label>
              <input
                placeholder="Enter car model name"
                value={form.model}
                onChange={(e) => {
                  setForm((f) => ({ ...f, model: e.target.value }))
                  clearFieldError('model')
                }}
                className={fieldInputClass(errors.model)}
                aria-invalid={!!errors.model}
              />
              <FieldError message={errors.model} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Variant *</label>
              <input
                placeholder="Enter variant"
                value={form.variant}
                onChange={(e) => {
                  setForm((f) => ({ ...f, variant: e.target.value }))
                  clearFieldError('variant')
                }}
                className={fieldInputClass(errors.variant)}
                aria-invalid={!!errors.variant}
              />
              <FieldError message={errors.variant} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Year *</label>
              <input
                type="number"
                step={1}
                min={1}
                placeholder="Enter manufacturing year"
                value={form.modelYear}
                onChange={(e) => {
                  setForm((f) => ({ ...f, modelYear: e.target.value }))
                  clearFieldError('modelYear')
                }}
                className={fieldInputClass(errors.modelYear)}
                aria-invalid={!!errors.modelYear}
              />
              <FieldError message={errors.modelYear} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Fuel *</label>
              <select
                value={form.fuel}
                onChange={(e) => {
                  setForm((f) => ({ ...f, fuel: e.target.value }))
                  clearFieldError('fuel')
                }}
                className={fieldInputClass(errors.fuel)}
                aria-invalid={!!errors.fuel}
              >
                <option value="">Select fuel type</option>
                {(carFormOptions.fuels || []).map((o) => (
                  <option key={o.label} value={o.label}>
                    {o.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.fuel} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Transmission</label>
              <select
                value={form.transmission}
                onChange={(e) => {
                  setForm((f) => ({ ...f, transmission: e.target.value }))
                  clearFieldError('transmission')
                }}
                className={fieldInputClass(errors.transmission)}
              >
                <option value="">Select transmission type</option>
                {(carFormOptions.transmissions || []).map((o) => (
                  <option key={o.label} value={o.label}>
                    {o.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.transmission} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Engine CC</label>
              <input
                type="number"
                min={0}
                placeholder="Enter engine displacement (CC)"
                value={form.engineCc}
                onChange={(e) => setForm((f) => ({ ...f, engineCc: e.target.value }))}
                className={inputClass}
              />
            </div>
            <label className="flex h-[42px] items-center gap-2 rounded-xl border border-steel/70 px-3 text-sm text-fog sm:mt-6">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              />
              Published
            </label>
            <div className="sm:col-span-2">
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">Notes</label>
              <textarea
                rows={2}
                placeholder="Enter vehicle description"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={`${inputClass} resize-y`}
              />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-steel/50 bg-ink/20 p-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Photo (optional)</p>
              <p className="mb-2 text-xs text-mist">Upload car image</p>
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={onCreatePhotoPick}
                aria-label="Upload car image"
                className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-on-accent"
              />
              {createPhoto ? (
                <img src={createPhoto} alt="Car preview" className="mt-2 h-20 w-28 rounded-lg border border-steel/60 object-cover" />
              ) : null}
            </div>
            <div className="sm:col-span-2 rounded-xl border border-steel/50 bg-ink/20 p-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Brand logo (optional)</p>
              <p className="mb-2 text-xs text-mist">Upload brand logo image</p>
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={onCreateBrandLogoPick}
                aria-label="Upload brand logo image"
                className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-hud file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-white"
              />
              {createBrandLogo ? (
                <img
                  src={createBrandLogo}
                  alt="Brand logo preview"
                  className="mt-2 h-16 w-16 rounded-lg border border-steel/60 object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-steel/40 pt-5 sm:col-span-2">
              <Link
                to="/admin/cars"
                className="rounded-xl border border-steel/70 bg-ink/20 px-5 py-2.5 text-sm font-medium text-mist transition-colors hover:bg-steel/30 hover:text-fog"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-w-[10rem] items-center justify-center rounded-xl bg-accent px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-accent shadow-sm transition-all hover:brightness-110 disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Create car'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
