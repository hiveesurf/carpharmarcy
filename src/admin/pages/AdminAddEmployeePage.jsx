import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'
import { normalizeEmployeePhone, validateEmployeeForm } from '../../lib/employeeFormValidation.js'

const MAX_RAW_FILE = 12 * 1024 * 1024

const canvasClass =
  '-mx-4 min-w-0 rounded-none bg-[#eaeded] px-4 py-5 dark:bg-ink/40 md:-mx-6 md:rounded-xl md:px-6 lg:-mx-0 lg:rounded-xl lg:px-8'

function emptyForm() {
  return { phone: '', role: 'sales', name: '' }
}

export function AdminAddEmployeePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState('')

  const inputClass =
    'w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2.5 text-sm text-fog outline-none transition-colors focus:border-accent/60 admin-input'

  function fieldInputClass(hasError) {
    return hasError ? `${inputClass} border-flare/60` : inputClass
  }

  function FieldError({ message }) {
    if (!message) return null
    return <p className="mt-1 text-xs text-flare">{message}</p>
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

  async function onPhotoPick(ev) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/') || f.size > MAX_RAW_FILE) {
      setError('Photo must be an image file up to 12MB.')
      return
    }
    try {
      setPhotoDataUrl(await imageFileToCompressedDataUrl(f))
    } catch (e) {
      setError(getFetchErrorMessage(e))
    }
  }

  async function submitCreate(e) {
    e.preventDefault()
    const validation = validateEmployeeForm(form)
    if (!validation.values) {
      setErrors(validation.errors)
      return
    }
    setErrors({})
    setSaving(true)
    setError(null)
    try {
      const body = { ...validation.values }
      if (photoDataUrl) body.photo = photoDataUrl
      const created = await adminService.createEmployee(body)
      navigate('/admin/employees', {
        replace: true,
        state: {
          success: true,
          highlightPhone: created?.phone ?? validation.values.phone,
        },
      })
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={canvasClass}>
      <div className="mx-auto max-w-[56rem] space-y-5">
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-2 rounded-xl border border-steel/70 bg-white px-4 py-2 text-sm font-medium text-mist shadow-sm transition-colors hover:border-accent/50 hover:text-accent dark:bg-slate"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to employees
        </Link>

        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-[#0f1111] dark:text-fog md:text-3xl">
            Add employee
          </h1>
          <p className="mt-1 text-sm text-[#565959] dark:text-mist">Create a new workforce employee</p>
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
                <UserPlus className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-tight text-fog">Employee details</h2>
                <p className="text-xs text-mist">All fields marked * are required</p>
              </div>
            </div>
          </div>

          <form onSubmit={submitCreate} className="grid gap-5 sm:grid-cols-2" noValidate>
            <div className="sm:col-span-1">
              <label htmlFor="emp-phone" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                Phone *
              </label>
              <input
                id="emp-phone"
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={(e) => {
                  setForm((f) => ({ ...f, phone: normalizeEmployeePhone(e.target.value) }))
                  clearFieldError('phone')
                }}
                maxLength={10}
                className={fieldInputClass(errors.phone)}
                aria-invalid={!!errors.phone}
              />
              <FieldError message={errors.phone} />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="emp-name" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                Name *
              </label>
              <input
                id="emp-name"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                  clearFieldError('name')
                }}
                className={fieldInputClass(errors.name)}
                aria-invalid={!!errors.name}
              />
              <FieldError message={errors.name} />
            </div>
            <div className="sm:col-span-2 sm:max-w-xs">
              <label htmlFor="emp-role" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                Role *
              </label>
              <select
                id="emp-role"
                value={form.role}
                onChange={(e) => {
                  setForm((f) => ({ ...f, role: e.target.value }))
                  clearFieldError('role')
                }}
                className={fieldInputClass(errors.role)}
                aria-invalid={!!errors.role}
              >
                <option value="sales">Sales</option>
                <option value="delivery">Delivery</option>
              </select>
              <FieldError message={errors.role} />
            </div>
            <div className="rounded-xl border border-steel/50 bg-ink/15 p-4 sm:col-span-2">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Photo (optional)</p>
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoPick}
                className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-hud file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-white"
              />
              {photoDataUrl ? (
                <img
                  src={photoDataUrl}
                  alt="Preview"
                  className="mt-3 h-24 w-24 rounded-xl border border-steel/60 object-cover shadow-sm"
                />
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-steel/40 pt-5 sm:col-span-2">
              <Link
                to="/admin/employees"
                className="rounded-xl border border-steel/70 bg-ink/20 px-5 py-2.5 text-sm font-medium text-mist transition-colors hover:bg-steel/30 hover:text-fog"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-w-[10rem] items-center justify-center rounded-xl bg-accent px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-accent shadow-sm transition-all hover:brightness-110 disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create employee'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
