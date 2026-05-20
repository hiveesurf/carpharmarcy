import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { imageFileToCompressedDataUrl } from '../../lib/compressImage.js'
import { resolveApiAssetUrl } from '../../lib/resolveApiAssetUrl.js'
import { normalizeEmployeePhone, validateEmployeeForm } from '../../lib/employeeFormValidation.js'
import { AdminStatCard } from '../components/AdminStatCard.jsx'

const MAX_RAW_FILE = 12 * 1024 * 1024
const LIST_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300
const HIGHLIGHT_MS = 6000

const filterInputClass =
  'w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2 font-sans text-sm text-fog outline-none transition-colors focus:border-accent/60 admin-input'

const canvasClass =
  '-mx-4 min-w-0 rounded-none bg-[#eaeded] px-4 py-5 dark:bg-ink/40 md:-mx-6 md:rounded-xl md:px-6 lg:-mx-0 lg:rounded-xl lg:px-8'

function emptyForm() {
  return { phone: '', role: 'sales', name: '' }
}

function normalizeAvailability(raw) {
  return String(raw ?? '').trim().toLowerCase()
}

/** @returns {'online' | 'busy' | 'offline'} */
function getEmployeeDisplayStatus(availability) {
  const a = normalizeAvailability(availability)
  if (a === 'online') return 'online'
  if (a === 'busy') return 'busy'
  return 'offline'
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function employeeMatchesSearch(row, query) {
  if (!query) return true
  const q = query.toLowerCase()
  const hay = [row.id, row.name, row.email, row.phone, row.role].filter(Boolean).join(' ').toLowerCase()
  return hay.includes(q)
}

function buildDisplaySummary(employees, apiSummary) {
  let online = 0
  let offline = 0
  for (const e of employees) {
    const a = normalizeAvailability(e.availability)
    if (a === 'online') online += 1
    else if (a !== 'busy') offline += 1
  }
  return {
    total: typeof apiSummary?.total === 'number' ? apiSummary.total : employees.length,
    online,
    offline,
  }
}

const STATUS_BADGE_PILL =
  'inline-flex h-6 min-w-[4.25rem] items-center justify-center rounded-full border px-2.5 text-[11px] font-medium leading-none'

/** Single neutral pill — inline styles only so Sales/Delivery never pick up theme/role colors. */
const ROLE_BADGE_STYLE = {
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  color: '#374151',
}

const TABLE_TH =
  'px-4 py-2.5 align-middle text-left text-xs font-semibold text-[#565959] dark:text-mist lg:px-5 lg:py-3'
const TABLE_CELL = 'px-4 py-2.5 align-middle text-left text-sm text-[#0f1111] dark:text-fog lg:px-5 lg:py-3'
const TABLE_CELL_META =
  'px-4 py-2.5 align-middle text-left text-sm text-[#565959] dark:text-mist lg:px-5 lg:py-3'
const TABLE_ROW =
  'h-12 transition-colors hover:bg-[#f7fafa] dark:hover:bg-steel/15 [&>td]:align-middle'

const MENU_MIN_WIDTH = 148
const MENU_GAP = 6
const MENU_EST_HEIGHT = 92

function formatRoleLabel(role) {
  const r = String(role ?? '').toLowerCase()
  if (r === 'sales') return 'Sales'
  if (r === 'delivery') return 'Delivery'
  return role ? String(role) : '—'
}

function RoleBadge({ role }) {
  return (
    <span
      className="inline-flex h-6 min-w-[4.25rem] items-center justify-center rounded-full px-2.5 text-[11px] font-medium leading-none"
      style={ROLE_BADGE_STYLE}
    >
      {formatRoleLabel(role)}
    </span>
  )
}

function AvailabilityBadge({ availability }) {
  const status = getEmployeeDisplayStatus(availability)
  const config = {
    online: {
      label: 'Online',
      pill:
        'border-emerald-400/50 bg-emerald-500/12 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/18 dark:text-emerald-100',
    },
    busy: {
      label: 'Busy',
      pill:
        'border-amber-400/50 bg-amber-500/12 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/18 dark:text-amber-100',
    },
    offline: {
      label: 'Offline',
      pill: 'border-zinc-300/80 bg-zinc-200/70 text-zinc-700 dark:border-zinc-600/60 dark:bg-zinc-700/50 dark:text-zinc-200',
    },
  }
  const c = config[status]
  return <span className={`${STATUS_BADGE_PILL} ${c.pill}`}>{c.label}</span>
}

function EmployeeRowActions({ row, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const label = row.name || row.phone || 'employee'

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight ?? MENU_EST_HEIGHT
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < menuHeight + MENU_GAP + 12
    const top = openUpward ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP
    const right = Math.max(8, window.innerWidth - rect.right)
    setMenuPos({ top, right })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    updateMenuPosition()
    const raf1 = requestAnimationFrame(() => {
      updateMenuPosition()
      requestAnimationFrame(updateMenuPosition)
    })
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      cancelAnimationFrame(raf1)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    function onPointerDown(ev) {
      const target = ev.target
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKeyDown(ev) {
      if (ev.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const actionBtnClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-[#565959] transition-colors hover:border-[#d5d9d9] hover:bg-white dark:text-mist dark:hover:border-steel/60 dark:hover:bg-steel/30'

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
              minWidth: MENU_MIN_WIDTH,
              zIndex: 200,
              visibility: menuPos ? 'visible' : 'hidden',
            }}
            className="overflow-hidden rounded-lg border border-[#d5d9d9] bg-white py-1 shadow-[0_4px_14px_rgba(15,17,17,0.15)] dark:border-steel/60 dark:bg-slate dark:shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#0f1111] hover:bg-[#f7fafa] dark:text-fog dark:hover:bg-steel/30"
              onClick={() => {
                setOpen(false)
                onEdit(row.phone)
              }}
            >
              <Pencil className="h-4 w-4 text-[#565959] dark:text-mist" aria-hidden />
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#b12704] hover:bg-[#fff4f4] dark:text-flare dark:hover:bg-flare-muted/30"
              onClick={() => {
                setOpen(false)
                onDelete(row)
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div className="inline-flex items-center justify-end gap-1">
      <Link
        to={`/admin/employees/${encodeURIComponent(row.phone)}`}
        className={actionBtnClass}
        title="View profile"
        aria-label={`View profile for ${label}`}
      >
        <Eye className="h-4 w-4" />
      </Link>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`${actionBtnClass} ${open ? 'border-[#d5d9d9] bg-white dark:border-steel/60 dark:bg-steel/30' : ''}`}
        aria-label={`Actions for ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      </div>
      {menu}
    </>
  )
}

export function AdminEmployeesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [apiSummary, setApiSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [highlightPhone, setHighlightPhone] = useState(null)
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(LIST_PAGE_SIZE)
  const [saving, setSaving] = useState(false)
  const [editingPhone, setEditingPhone] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm())
  const [editErrors, setEditErrors] = useState({})
  const [editPhoto, setEditPhoto] = useState('')
  const [editExistingPhoto, setEditExistingPhoto] = useState('')
  const [clearEditPhoto, setClearEditPhoto] = useState(false)
  const [editPhotoLoadError, setEditPhotoLoadError] = useState(false)

  const displaySummary = useMemo(
    () => buildDisplaySummary(items, apiSummary),
    [items, apiSummary],
  )

  useEffect(() => {
    const id = window.setTimeout(() => setSearchQuery(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    const state = location.state
    if (state?.success) {
      setSuccessMessage('Employee added successfully')
      if (state.highlightPhone) setHighlightPhone(String(state.highlightPhone))
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    if (!highlightPhone) return
    const t = window.setTimeout(() => setHighlightPhone(null), HIGHLIGHT_MS)
    return () => window.clearTimeout(t)
  }, [highlightPhone])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [employees, stats] = await Promise.all([
        adminService.listEmployees(),
        adminService.getEmployeesSummary(),
      ])
      const sorted = [...employees].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
      setItems(sorted)
      setApiSummary(stats)
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setItems([])
      setApiSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setVisibleCount(LIST_PAGE_SIZE)
  }, [searchQuery, roleFilter, statusFilter])

  useEffect(() => {
    if (!editingPhone) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') setEditingPhone(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [editingPhone])

  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      if (roleFilter && String(row.role ?? '').toLowerCase() !== roleFilter) return false
      const displayStatus = getEmployeeDisplayStatus(row.availability)
      if (statusFilter === 'online' && displayStatus !== 'online') return false
      if (statusFilter === 'offline' && displayStatus !== 'offline') return false
      if (statusFilter === 'busy' && displayStatus !== 'busy') return false
      return employeeMatchesSearch(row, searchQuery)
    })
  }, [items, searchQuery, roleFilter, statusFilter])

  const visibleItems = filteredItems.slice(0, visibleCount)
  const hasMore = visibleCount < filteredItems.length

  async function startEdit(phone) {
    setError(null)
    try {
      const employee = await adminService.getEmployee(phone)
      if (!employee) return
      setEditingPhone(phone)
      setEditForm({
        phone: employee.phone ?? '',
        name: employee.name ?? '',
        role: employee.role === 'delivery' ? 'delivery' : 'sales',
      })
      setEditExistingPhoto(typeof employee.photoUrl === 'string' ? employee.photoUrl : '')
      setEditPhoto('')
      setClearEditPhoto(false)
      setEditPhotoLoadError(false)
      setEditErrors({})
    } catch (e) {
      setError(getFetchErrorMessage(e))
    }
  }

  async function submitEdit(e) {
    e.preventDefault()
    if (!editingPhone) return
    const validation = validateEmployeeForm(editForm)
    if (!validation.values) {
      setEditErrors(validation.errors)
      return
    }
    setEditErrors({})
    setSaving(true)
    setError(null)
    try {
      const body = { ...validation.values }
      if (clearEditPhoto) body.photo = ''
      else if (editPhoto) body.photo = editPhoto
      await adminService.updateEmployee(editingPhone, body)
      setEditingPhone(null)
      await load()
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function removeEmployee(row) {
    const label = row.name || row.phone || 'this employee'
    if (!window.confirm(`Delete employee "${label}"? This cannot be undone.`)) return
    setSaving(true)
    setError(null)
    try {
      await adminService.removeEmployee(row.phone)
      if (editingPhone === row.phone) setEditingPhone(null)
      await load()
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setSaving(false)
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
      const dataUrl = await imageFileToCompressedDataUrl(f)
      setEditPhoto(dataUrl)
      setClearEditPhoto(false)
      setEditPhotoLoadError(false)
    } catch (e) {
      setError(getFetchErrorMessage(e))
    }
  }

  const inputClass =
    'w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2 text-sm text-fog outline-none focus:border-accent/60 admin-input'
  const editModalFieldBase =
    'h-10 min-h-10 w-full rounded-lg border border-steel/80 bg-ink/40 px-3 text-sm text-fog outline-none focus:border-accent/60'

  function fieldInputClass(hasError) {
    return hasError ? `${inputClass} border-flare/60` : inputClass
  }
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

  return (
    <div className={canvasClass}>
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-[#0f1111] dark:text-fog md:text-3xl">
              Employees
            </h1>
            <p className="mt-1 text-sm text-[#565959] dark:text-mist">
              Manage workforce employees and live availability
            </p>
          </div>
          <Link
            to="/admin/employees/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-accent shadow-md transition-all hover:brightness-110 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add employee
          </Link>
        </div>

        {successMessage ? (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-fog shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/15"
          >
            <span className="font-medium text-emerald-800 dark:text-emerald-200">{successMessage}</span>
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

        {error ? (
          <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog shadow-sm">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminStatCard label="Total Employees" value={displaySummary.total} icon={Users} accent="text-hud" />
          <AdminStatCard
            label="Online Employees"
            value={displaySummary.online}
            icon={Wifi}
            accent="text-emerald-600 dark:text-emerald-400"
            tone="online"
          />
          <AdminStatCard
            label="Offline Employees"
            value={displaySummary.offline}
            icon={WifiOff}
            accent="text-mist"
            tone="offline"
          />
        </div>

        <section className="admin-card rounded-2xl p-4 shadow-sm sm:p-5">
          <div className="mb-3 border-b border-steel/40 pb-3">
            <h2 className="text-sm font-semibold text-fog">Search &amp; filters</h2>
            <p className="mt-0.5 text-xs text-mist">Find employees by details or availability</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:items-end">
            <div className="md:col-span-2 lg:col-span-1">
              <label htmlFor="emp-search" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
                <input
                  id="emp-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, phone, email, or role"
                  className={`${filterInputClass} pl-9`}
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <label htmlFor="emp-role-filter" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                Role
              </label>
              <select
                id="emp-role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={filterInputClass}
              >
                <option value="">All Roles</option>
                <option value="sales">Sales</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
            <div>
              <label htmlFor="emp-status-filter" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                Status
              </label>
              <select
                id="emp-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={filterInputClass}
              >
                <option value="">All</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="busy">Busy</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d5d9d9] bg-white shadow-sm dark:border-steel/60 dark:bg-slate">
          <div className="flex flex-col gap-1 border-b border-[#e7e7e7] bg-[#fafafa] px-5 py-3 dark:border-steel/50 dark:bg-ink/15 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0f1111] dark:text-fog">Workforce</h2>
              <p className="text-xs text-[#565959] dark:text-mist">
                {loading ? 'Loading…' : `${filteredItems.length} employee${filteredItems.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="w-full border-collapse text-left lg:table-fixed">
              <colgroup className="hidden lg:table-column-group">
                <col style={{ width: '24%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[#e7e7e7] bg-[#fafafa] dark:border-steel/50 dark:bg-ink/15">
                  <th className={TABLE_TH}>Employee</th>
                  <th className={TABLE_TH}>Contact</th>
                  <th className={TABLE_TH}>Role</th>
                  <th className={TABLE_TH}>Status</th>
                  <th className={TABLE_TH}>Login</th>
                  <th className={TABLE_TH}>Logout</th>
                  <th className={`${TABLE_TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e7e7] bg-white dark:divide-steel/40 dark:bg-slate">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-mist">
                      Loading employees…
                    </td>
                  </tr>
                ) : visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <p className="font-medium text-fog">No employees found</p>
                      <p className="mt-1 text-sm text-mist">
                        {items.length === 0
                          ? 'Add your first employee to get started.'
                          : 'Try adjusting search or filters.'}
                      </p>
                      {items.length === 0 ? (
                        <Link
                          to="/admin/employees/new"
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Add employee
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((row) => {
                    const photo = resolveApiAssetUrl(row.photoUrl)
                    const initials = (row.name || row.phone || 'E').trim().charAt(0).toUpperCase()
                    const isHighlighted = highlightPhone && row.phone === highlightPhone
                    return (
                      <tr
                        key={row.id || row.phone}
                        className={`${TABLE_ROW} ${isHighlighted ? 'bg-emerald-500/10' : ''}`}
                      >
                        <td className={TABLE_CELL}>
                          <div className="flex items-center gap-3">
                            {photo ? (
                              <img
                                src={photo}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-full border border-steel/60 object-cover"
                              />
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-steel/50 to-ink/60 font-display text-sm font-bold text-fog ring-1 ring-steel/50">
                                {initials}
                              </span>
                            )}
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-fog">{row.name || '—'}</p>
                              {isHighlighted ? (
                                <span className="inline-flex shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-on-accent">
                                  New
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className={`${TABLE_CELL} font-mono tabular-nums`}>{row.phone || '—'}</td>
                        <td className={TABLE_CELL}>
                          <div className="flex items-center">
                            <RoleBadge role={row.role} />
                          </div>
                        </td>
                        <td className={TABLE_CELL}>
                          <div className="flex items-center">
                            <AvailabilityBadge availability={row.availability} />
                          </div>
                        </td>
                        <td className={`${TABLE_CELL_META} whitespace-nowrap`}>
                          {formatDateTime(row.lastLoginAt)}
                        </td>
                        <td className={`${TABLE_CELL_META} whitespace-nowrap`}>
                          {formatDateTime(row.lastLogoutAt)}
                        </td>
                        <td className={`${TABLE_CELL} text-right`}>
                          <div className="flex items-center justify-end">
                            <EmployeeRowActions row={row} onEdit={startEdit} onDelete={removeEmployee} />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {hasMore ? (
            <div className="flex justify-center border-t border-steel/40 px-4 py-3">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + LIST_PAGE_SIZE)}
                className="rounded-xl border border-steel/80 bg-ink/20 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist transition-colors hover:border-accent/50 hover:text-accent"
              >
                Load more
              </button>
            </div>
          ) : null}
        </section>

        {editingPhone ? (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={() => setEditingPhone(null)}
          >
            <div
              className="flex max-h-[80vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-steel/60 bg-slate shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-edit-employee-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-steel/50 bg-slate px-5 py-4">
                <h2 id="admin-edit-employee-title" className="font-display text-base font-bold tracking-tight text-fog md:text-lg">
                  Edit Employee
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingPhone(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-steel/60 text-fog hover:bg-steel/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form id="admin-edit-employee-form" onSubmit={submitEdit} className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  <div>
                    <input
                      placeholder="Phone *"
                      value={editForm.phone}
                      onChange={(e) => {
                        setEditForm((f) => ({ ...f, phone: normalizeEmployeePhone(e.target.value) }))
                        clearEditFieldError('phone')
                      }}
                      maxLength={10}
                      className={editModalFieldClass(editErrors.phone)}
                      aria-invalid={!!editErrors.phone}
                    />
                    <FieldError message={editErrors.phone} />
                  </div>
                  <div>
                    <input
                      placeholder="Name *"
                      value={editForm.name}
                      onChange={(e) => {
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                        clearEditFieldError('name')
                      }}
                      className={editModalFieldClass(editErrors.name)}
                      aria-invalid={!!editErrors.name}
                    />
                    <FieldError message={editErrors.name} />
                  </div>
                  <div>
                    <select
                      value={editForm.role}
                      onChange={(e) => {
                        setEditForm((f) => ({ ...f, role: e.target.value }))
                        clearEditFieldError('role')
                      }}
                      className={editModalFieldClass(editErrors.role)}
                      aria-invalid={!!editErrors.role}
                    >
                      <option value="sales">Sales</option>
                      <option value="delivery">Delivery</option>
                    </select>
                    <FieldError message={editErrors.role} />
                  </div>
                  <div />
                </div>
                <div className="rounded-lg border border-steel/50 bg-ink/20 p-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-hud">Photo (optional)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhotoPick}
                    className="text-xs text-mist file:mr-2 file:rounded-md file:border-0 file:bg-hud file:px-2.5 file:py-1.5 file:font-mono file:text-[10px] file:text-white"
                  />
                  {editPhoto || (editExistingPhoto && !clearEditPhoto) ? (
                    !editPhotoLoadError ? (
                      <img
                        src={editPhoto || editExistingPhoto}
                        alt={editPhoto ? 'Edited preview' : 'Current'}
                        onError={() => setEditPhotoLoadError(true)}
                        className="mt-2 h-16 w-16 rounded-md border border-steel/60 object-cover"
                      />
                    ) : (
                      <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-md border border-steel/60 bg-steel/20 text-[10px] font-semibold uppercase tracking-wide text-mist">
                        No image
                      </div>
                    )
                  ) : (
                    <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-md border border-steel/60 bg-steel/20 text-[10px] font-semibold uppercase tracking-wide text-mist">
                      No image
                    </div>
                  )}
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-mist">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
                      checked={clearEditPhoto}
                      onChange={(e) => setClearEditPhoto(e.target.checked)}
                    />
                    Remove existing photo
                  </label>
                </div>
              </form>
              <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-end gap-2 border-t border-steel/50 bg-slate px-5 py-4">
                <button
                  type="button"
                  onClick={() => setEditingPhone(null)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-steel/70 px-5 text-sm font-semibold text-mist hover:border-hud/60 hover:text-hud"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="admin-edit-employee-form"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-on-accent shadow-sm disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save Employee'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
