import { useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'

const availabilityOptions = ['free', 'busy', 'offline']
const MAX_RAW_FILE = 12 * 1024 * 1024
const PAGE_SIZE = 5

export function AdminEmployeesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [form, setForm] = useState({ phone: '', role: 'sales', name: '' })
  const [photoDataUrl, setPhotoDataUrl] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await adminService.listEmployeesPage({ page: 0, size: PAGE_SIZE })
      setItems(result.items)
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setItems([])
      setHasMore(false)
      setNextPage(1)
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const result = await adminService.listEmployeesPage({ page: nextPage, size: PAGE_SIZE })
      setItems((prev) => [...prev, ...result.items])
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = { ...form }
      if (photoDataUrl) body.photo = photoDataUrl
      await adminService.createEmployee(body)
      setForm({ phone: '', role: 'sales', name: '' })
      setPhotoDataUrl('')
      await load()
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function updateAvailability(phone, availability) {
    try {
      await adminService.setEmployeeAvailability(phone, availability)
      setItems((prev) => prev.map((x) => (x.phone === phone ? { ...x, availability } : x)))
    } catch (e) {
      setError(getFetchErrorMessage(e))
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-fog md:text-3xl">Employees</h1>
        <p className="text-sm text-mist">Create sales/delivery employee accounts and monitor activity.</p>
      </div>
      {error ? <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">{error}</div> : null}

      <section className="admin-card p-4">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-hud">Create employee</h2>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone number" className="w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2 text-sm text-fog" />
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" className="w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2 text-sm text-fog" />
          <div className="md:col-span-2 rounded-xl border border-steel/50 bg-ink/20 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Photo (optional)</p>
            <input type="file" accept="image/*" onChange={onPhotoPick} className="text-xs text-mist file:mr-2 file:rounded-lg file:border-0 file:bg-hud file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:text-white" />
            {photoDataUrl ? <img src={photoDataUrl} alt="Employee preview" className="mt-2 h-16 w-16 rounded-lg border border-steel/60 object-cover" /> : null}
          </div>
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2 text-sm text-fog">
            <option value="sales">Sales</option>
            <option value="delivery">Delivery</option>
            <option value="super_admin">Super admin</option>
          </select>
          <button type="submit" disabled={saving} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-60">
            {saving ? 'Saving…' : 'Create'}
          </button>
        </form>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-steel/50 font-mono text-[10px] uppercase tracking-wider text-mist">
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">First login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel/40">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Loading employees…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">No employees.</td></tr>
              ) : items.map((row) => (
                <tr key={row.id} className="hover:bg-steel/25">
                  <td className="px-4 py-3 font-mono text-xs text-fog">{row.phone || '—'}</td>
                  <td className="px-4 py-3 text-mist">{row.name || '—'}</td>
                  <td className="px-4 py-3 uppercase text-mist">{row.role}</td>
                  <td className="px-4 py-3 uppercase text-mist">{row.status || 'pending'}</td>
                  <td className="px-4 py-3">
                    {row.role === 'delivery' ? (
                      <select value={row.availability || 'offline'} onChange={(e) => updateAvailability(row.phone, e.target.value)} className="rounded-lg border border-steel/80 bg-ink/40 px-2 py-1 text-xs text-fog">
                        {availabilityOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    ) : (
                      <span className="text-mist">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mist">{row.firstLoginAt ? new Date(row.firstLoginAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-xl border border-steel/80 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
