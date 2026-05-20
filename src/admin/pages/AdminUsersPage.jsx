import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  Ban,
  ChevronDown,
  Filter,
  Mail,
  MoreVertical,
  Phone,
  RefreshCw,
  Search,
  UserCheck,
  UserRound,
  Users,
  UserX,
} from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { resolveApiAssetUrl } from '../../lib/resolveApiAssetUrl.js'

const PAGE_SIZE = 10
const PHONE_SEARCH_DEBOUNCE_MS = 350
const CUSTOMER_ROLE = 'user'

const canvasClass =
  '-mx-4 min-w-0 rounded-none bg-[#eaeded] px-4 py-5 dark:bg-ink/40 md:-mx-6 md:rounded-xl md:px-6 lg:-mx-0 lg:rounded-xl lg:px-8'

const AMAZON_TEAL_BTN =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#007185] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#005f6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007185]/40 disabled:opacity-50'

const FILTER_FIELD_LABEL = 'mb-1 block text-xs font-normal text-[#565959] dark:text-mist'
const FILTER_INPUT =
  'h-10 w-full min-w-0 rounded-md border border-[#888c8c] bg-white px-3 text-sm text-[#0f1111] outline-none focus:border-[#007185] focus:ring-1 focus:ring-[#007185]/30 dark:border-steel/60 dark:bg-slate dark:text-fog'
const FILTER_SELECT = `${FILTER_INPUT} appearance-none pr-10`
const TOOLBAR_BTN =
  'inline-flex h-10 flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-[#888c8c] bg-white px-3 text-sm font-normal text-[#0f1111] hover:bg-[#f7fafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007185]/30 dark:border-steel/60 dark:bg-slate dark:text-fog dark:hover:bg-steel/30'

const FILTER_TOOLBAR_ROW =
  'flex w-full min-w-0 flex-wrap items-end gap-3 lg:flex-nowrap'

const TABLE_TH =
  'px-3 py-2 align-middle text-left text-[11px] font-semibold text-[#565959] dark:text-mist lg:px-4'
const TABLE_CELL = 'px-3 py-2 align-middle text-left text-[13px] text-[#0f1111] dark:text-fog lg:px-4'
const TABLE_CELL_META = 'px-3 py-2 align-middle text-left text-[13px] text-[#565959] dark:text-mist lg:px-4'
const TABLE_ROW = 'h-11 transition-colors hover:bg-[#f7fafa] dark:hover:bg-steel/15'

const STATUS_BADGE_PILL =
  'inline-flex h-6 min-w-[4.5rem] items-center justify-center rounded-full border px-2.5 text-[11px] font-medium capitalize leading-none'

const STATUS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'blocked', label: 'Blocked' },
]

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
]

const MENU_MIN_WIDTH = 148
const MENU_GAP = 6
const MENU_EST_HEIGHT = 48

function FilterSelect({ id, value, onChange, className = '', children }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={onChange} className={`${FILTER_SELECT} ${className}`.trim()}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565959] dark:text-mist"
        aria-hidden
      />
    </div>
  )
}

function looksLikePhoneQuery(text) {
  const t = String(text ?? '').trim()
  if (!t) return false
  const digits = t.replace(/\D/g, '')
  return digits.length >= 4 && /^[\d\s+\-().]+$/.test(t)
}

/** Storefront customers only (role user). */
function isStorefrontCustomer(row) {
  return String(row?.role ?? 'user').toLowerCase() === CUSTOMER_ROLE
}

/**
 * Account status for customer list — API has no blocked/inactive flags;
 * active = storefront customer; inactive/blocked always 0 in summaries.
 */
function customerAccountStatus(row) {
  if (!isStorefrontCustomer(row)) return 'blocked'
  return 'active'
}

function isDisplayableEmail(email) {
  const e = String(email ?? '').trim()
  if (!e) return false
  if (!e.includes('@')) return false
  const lower = e.toLowerCase()
  if (lower.endsWith('@placeholder.local')) return false
  if (lower.includes('noreply') && lower.includes('internal')) return false
  return true
}

function customerDisplayName(row) {
  const name = String(row?.name ?? '').trim()
  if (name) return name
  const phone = String(row?.phone ?? '').trim()
  if (phone) return phone
  return 'User'
}

function customerInitials(row) {
  const name = customerDisplayName(row)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (name[0] || 'C').toUpperCase()
}

function formatLastActivity(row) {
  const iso = row?.lastLoginAt || row?.updatedAt || row?.createdAt
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (isToday) {
    return `Today, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
  }
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function compareCustomers(a, b, sortKey) {
  const idA = String(a?.id ?? '')
  const idB = String(b?.id ?? '')
  if (sortKey === 'oldest') return idA.localeCompare(idB)
  return idB.localeCompare(idA)
}

function StatusBadge({ status }) {
  const config = {
    active: {
      label: 'Active',
      className:
        'border-emerald-400/50 bg-emerald-500/12 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/18 dark:text-emerald-100',
    },
    inactive: {
      label: 'Inactive',
      className:
        'border-amber-400/50 bg-amber-500/12 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/18 dark:text-amber-100',
    },
    blocked: {
      label: 'Blocked',
      className:
        'border-red-400/50 bg-red-500/12 text-red-900 dark:border-red-500/40 dark:bg-red-500/18 dark:text-red-100',
    },
  }
  const c = config[status] ?? config.active
  return <span className={`${STATUS_BADGE_PILL} ${c.className}`}>{c.label}</span>
}

function CustomerSummaryCard({ label, value, icon: Icon, iconBg, iconColor, footer }) {
  return (
    <div className="flex min-h-[5.25rem] flex-col rounded-lg border border-[#d5d9d9] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,17,17,0.07)] dark:border-steel/60 dark:bg-slate">
      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
        aria-hidden
      >
        {Icon ? <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} /> : null}
      </div>
      <p className="font-sans text-xl font-semibold tabular-nums leading-none tracking-tight text-[#0f1111] dark:text-fog">
        {value ?? 0}
      </p>
      <p className="mt-1 text-[11px] leading-tight text-[#565959] dark:text-mist">{label}</p>
      {footer ? <p className="mt-0.5 text-[10px] text-[#007185] dark:text-[#48a6b8]">{footer}</p> : null}
    </div>
  )
}

function CustomerRowActions({ customerId, customerName }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const profilePath = `/admin/users/${encodeURIComponent(customerId)}`

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

  useEffect(() => {
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
    if (!open) return
    function onPointerDown(ev) {
      const t = ev.target
      if (triggerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
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
            className="overflow-hidden rounded-lg border border-[#d5d9d9] bg-white py-1 shadow-[0_4px_14px_rgba(15,17,17,0.15)] dark:border-steel/60 dark:bg-slate"
          >
            <Link
              to={profilePath}
              role="menuitem"
              className="block px-3 py-2.5 text-sm text-[#0f1111] hover:bg-[#f7fafa] dark:text-fog dark:hover:bg-steel/30"
              onClick={() => setOpen(false)}
            >
              View user details
            </Link>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      <Link
        to={profilePath}
        className="whitespace-nowrap rounded border border-[#d5d9d9] bg-white px-2.5 py-1 text-[11px] font-normal text-[#0f1111] shadow-[0_1px_2px_rgba(15,17,17,0.08)] hover:bg-[#f7fafa] dark:border-steel/60 dark:bg-slate dark:text-fog dark:hover:bg-steel/30"
        title={`View ${customerName}`}
      >
        View
      </Link>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border border-transparent text-[#565959] hover:border-[#d5d9d9] hover:bg-[#f7fafa] dark:hover:bg-steel/30 ${open ? 'border-[#d5d9d9] bg-[#f7fafa]' : ''}`}
        aria-label={`More actions for ${customerName}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>
      {menu}
    </div>
  )
}

function buildCustomerSummary(allCustomers) {
  const customers = allCustomers.filter(isStorefrontCustomer)
  const total = customers.length
  const active = customers.filter((c) => customerAccountStatus(c) === 'active').length
  const inactive = customers.filter((c) => customerAccountStatus(c) === 'inactive').length
  const blocked = customers.filter((c) => customerAccountStatus(c) === 'blocked').length
  const pct = (n) => (total > 0 ? `${Math.round((n / total) * 100)}% of total` : '0% of total')
  return { total, active, inactive, blocked, pct }
}

export function AdminUsersPage() {
  const [items, setItems] = useState([])
  const [allCustomers, setAllCustomers] = useState([])
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [phoneForApi, setPhoneForApi] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersRef = useRef(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      const t = searchInput.trim()
      setPhoneForApi(looksLikePhoneQuery(t) ? t.replace(/\D/g, '') : '')
    }, PHONE_SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    if (!filtersOpen) return
    function onPointerDown(ev) {
      if (filtersRef.current?.contains(ev.target)) return
      setFiltersOpen(false)
    }
    function onKeyDown(ev) {
      if (ev.key === 'Escape') setFiltersOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [filtersOpen])

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const list = await adminService.listUsers()
      setAllCustomers(Array.isArray(list) ? list.filter(isStorefrontCustomer) : [])
    } catch {
      setAllCustomers([])
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminService.listUsersPage({
        page: 0,
        size: PAGE_SIZE,
        phone: phoneForApi || undefined,
        role: CUSTOMER_ROLE,
      })
      setItems(result.items)
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
      void loadSummary()
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setItems([])
      setHasMore(false)
      setNextPage(1)
    } finally {
      setLoading(false)
    }
  }, [phoneForApi, loadSummary])

  useEffect(() => {
    void load()
  }, [load])

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const result = await adminService.listUsersPage({
        page: nextPage,
        size: PAGE_SIZE,
        phone: phoneForApi || undefined,
        role: CUSTOMER_ROLE,
      })
      setItems((prev) => [...prev, ...result.items])
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setLoadingMore(false)
    }
  }

  const summary = useMemo(() => buildCustomerSummary(allCustomers), [allCustomers])

  const normalizedSearch = searchInput.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    let rows = items.filter(isStorefrontCustomer)

    if (normalizedSearch && !phoneForApi) {
      rows = rows.filter((row) => {
        const name = String(row?.name ?? '').toLowerCase()
        const phone = String(row?.phone ?? '').toLowerCase()
        const email = String(row?.email ?? '').toLowerCase()
        return (
          name.includes(normalizedSearch) ||
          phone.includes(normalizedSearch) ||
          (email && email.includes(normalizedSearch))
        )
      })
    }

    if (statusFilter !== 'all') {
      rows = rows.filter((row) => customerAccountStatus(row) === statusFilter)
    }

    return [...rows].sort((a, b) => compareCustomers(a, b, sortBy))
  }, [items, normalizedSearch, phoneForApi, statusFilter, sortBy])

  const hasExtraFilterActive = false

  return (
    <div className={canvasClass}>
      <div className="mx-auto max-w-[90rem] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-normal text-[#0f1111] dark:text-fog sm:text-[1.35rem]">
              Users
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#565959] dark:text-mist">
              Manage your users, view their details, and track their activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className={`${AMAZON_TEAL_BTN} self-start`}
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <CustomerSummaryCard
            label="Total users"
            value={summaryLoading ? '…' : summary.total}
            icon={Users}
            iconBg="bg-blue-50 dark:bg-blue-500/15"
            iconColor="text-blue-600"
            footer={summaryLoading ? null : 'View all users'}
          />
          <CustomerSummaryCard
            label="Active users"
            value={summaryLoading ? '…' : summary.active}
            icon={UserCheck}
            iconBg="bg-emerald-50 dark:bg-emerald-500/15"
            iconColor="text-emerald-600"
            footer={summaryLoading ? null : summary.pct(summary.active)}
          />
          <CustomerSummaryCard
            label="Inactive users"
            value={summaryLoading ? '…' : summary.inactive}
            icon={UserX}
            iconBg="bg-amber-50 dark:bg-amber-500/15"
            iconColor="text-amber-600"
            footer={summaryLoading ? null : summary.pct(summary.inactive)}
          />
          <CustomerSummaryCard
            label="Blocked users"
            value={summaryLoading ? '…' : summary.blocked}
            icon={Ban}
            iconBg="bg-red-50 dark:bg-red-500/15"
            iconColor="text-red-600"
            footer={summaryLoading ? null : summary.pct(summary.blocked)}
          />
        </div>

        <section className="min-w-0 rounded-lg border border-[#d5d9d9] bg-white shadow-[0_1px_2px_rgba(15,17,17,0.07)] dark:border-steel/60 dark:bg-slate">
          <div className="w-full min-w-0 border-b border-[#e7e7e7] px-3 py-3 dark:border-steel/50 sm:px-4">
            <div className={FILTER_TOOLBAR_ROW}>
              <div className="relative z-30 min-w-[280px] max-w-none w-full flex-1">
                <label htmlFor="customers-search" className={FILTER_FIELD_LABEL}>
                  Search
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565959] dark:text-mist"
                    aria-hidden
                  />
                  <input
                    id="customers-search"
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by name, email, or phone number"
                    autoComplete="off"
                    className={`${FILTER_INPUT} pl-9`}
                  />
                </div>
              </div>

              <div className="w-full flex-shrink-0 lg:w-[170px]">
                <label htmlFor="customers-filter-status" className={FILTER_FIELD_LABEL}>
                  Status
                </label>
                <FilterSelect
                  id="customers-filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full lg:w-[170px]"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </FilterSelect>
              </div>

              <div className="w-full flex-shrink-0 lg:w-[170px]">
                <label htmlFor="customers-filter-sort" className={FILTER_FIELD_LABEL}>
                  Sort by
                </label>
                <FilterSelect
                  id="customers-filter-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full lg:w-[170px]"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </FilterSelect>
              </div>

              <div className="relative flex-shrink-0" ref={filtersRef}>
                <span className={FILTER_FIELD_LABEL} aria-hidden>
                  &nbsp;
                </span>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  className={`${TOOLBAR_BTN}${hasExtraFilterActive ? ' border-[#007185] ring-1 ring-[#007185]/25' : ''}`}
                  aria-expanded={filtersOpen}
                  aria-haspopup="true"
                >
                  <Filter className="h-4 w-4" aria-hidden />
                  Filters
                </button>
                {filtersOpen ? (
                  <div className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-[#d5d9d9] bg-white py-2 shadow-[0_4px_14px_rgba(15,17,17,0.15)] dark:border-steel/60 dark:bg-slate">
                    <p className="px-3 py-2 text-xs text-[#565959] dark:text-mist">
                      No additional filters available
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-b border-[#e7e7e7] bg-[#fafafa] px-4 py-2.5 dark:border-steel/50 dark:bg-ink/10">
            <h2 className="text-sm font-semibold text-[#0f1111] dark:text-fog">Users</h2>
            <p className="text-[11px] text-[#565959] dark:text-mist">
              {loading
                ? 'Loading…'
                : `${filteredItems.length} user${filteredItems.length === 1 ? '' : 's'} shown`}
              {hasMore && !loading ? ' · more available' : ''}
            </p>
          </div>

          {loading ? (
            <p className="px-4 py-12 text-center text-sm text-[#565959] dark:text-mist">Loading users…</p>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f4f6] dark:bg-steel/25"
                aria-hidden
              >
                <UserRound className="h-7 w-7 text-[#aab7b8] dark:text-mist" strokeWidth={1.5} />
              </div>
              <p className="mt-4 text-base font-medium text-[#0f1111] dark:text-fog">No users found</p>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#565959] dark:text-mist">
                {items.length === 0
                  ? 'New user registrations will appear here.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto lg:overflow-x-visible">
              <table className="w-full border-collapse text-left lg:table-fixed">
                <colgroup className="hidden lg:table-column-group">
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-[#fafafa] dark:bg-ink/15">
                  <tr className="border-b border-[#e7e7e7] dark:border-steel/50">
                    <th className={TABLE_TH}>User</th>
                    <th className={TABLE_TH}>Contact</th>
                    <th className={TABLE_TH}>User type</th>
                    <th className={TABLE_TH}>Status</th>
                    <th className={`${TABLE_TH} text-right`}>Orders</th>
                    <th className={TABLE_TH}>Last activity</th>
                    <th className={`${TABLE_TH} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e7e7] dark:divide-steel/40">
                  {filteredItems.map((row) => {
                    const name = customerDisplayName(row)
                    const avatar = resolveApiAssetUrl(row?.avatarUrl)
                    const email = isDisplayableEmail(row?.email) ? String(row.email).trim() : null
                    const orderCount =
                      typeof row?.orderCount === 'number' && !Number.isNaN(row.orderCount)
                        ? row.orderCount
                        : 0
                    const accountStatus = customerAccountStatus(row)

                    return (
                      <tr key={row.id} className={TABLE_ROW}>
                        <td className={TABLE_CELL}>
                          <div className="flex min-w-0 items-center gap-2.5">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-full border border-[#d5d9d9] object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7e7e7] text-xs font-semibold text-[#565959] dark:bg-steel/40 dark:text-mist">
                                {customerInitials(row)}
                              </div>
                            )}
                            <span className="truncate font-medium text-[#0f1111] dark:text-fog">{name}</span>
                          </div>
                        </td>
                        <td className={TABLE_CELL}>
                          <div className="space-y-0.5">
                            {row.phone ? (
                              <p className="flex items-center gap-1.5 text-[12px] text-[#0f1111] dark:text-fog">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-[#565959]" aria-hidden />
                                <span className="font-mono">{row.phone}</span>
                              </p>
                            ) : (
                              <p className="text-[12px] text-[#565959]">—</p>
                            )}
                            {email ? (
                              <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-[#565959] dark:text-mist">
                                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                <span className="truncate">{email}</span>
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className={TABLE_CELL_META}>—</td>
                        <td className={TABLE_CELL}>
                          <StatusBadge status={accountStatus} />
                        </td>
                        <td className={`${TABLE_CELL} text-right tabular-nums`}>{orderCount}</td>
                        <td className={`${TABLE_CELL_META} whitespace-nowrap`}>
                          {formatLastActivity(row)}
                        </td>
                        <td className={`${TABLE_CELL} text-right`}>
                          <CustomerRowActions customerId={row.id} customerName={name} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {hasMore ? (
            <div className="flex flex-col items-center gap-2 border-t border-[#e7e7e7] px-4 py-3 dark:border-steel/50 sm:flex-row sm:justify-between">
              <p className="text-[11px] text-[#565959] dark:text-mist">
                Showing {filteredItems.length} loaded · {PAGE_SIZE} per request
              </p>
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-lg border border-[#007185] bg-white px-5 py-2 text-sm font-medium text-[#007185] hover:bg-[#007185]/10 disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
