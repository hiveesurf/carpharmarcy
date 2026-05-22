import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Phone, RefreshCw, Search, UserRound } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { resolveApiAssetUrl } from '../../lib/resolveApiAssetUrl.js'

const PAGE_SIZE = 10
const PHONE_SEARCH_DEBOUNCE_MS = 350
const CUSTOMER_ROLE = 'user'

const canvasClass =
  '-mx-4 min-w-0 rounded-none bg-[#eaeded] px-4 py-5 dark:bg-ink/40 md:-mx-6 md:rounded-xl md:px-6 lg:-mx-0 lg:rounded-xl lg:px-8'

const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent shadow-sm transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50'

const FILTER_FIELD_LABEL = 'mb-1 block text-xs font-medium text-[#565959] dark:text-mist'
const FILTER_INPUT =
  'h-10 w-full min-w-0 rounded-lg border border-[#d5d9d9] bg-white px-3 text-sm text-[#0f1111] outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 dark:border-steel/60 dark:bg-slate dark:text-fog'
const FILTER_SELECT = `${FILTER_INPUT} appearance-none pr-10`

const FILTER_TOOLBAR_ROW =
  'flex w-full min-w-0 flex-wrap items-end gap-3 lg:flex-nowrap'

const TABLE_TH =
  'px-4 py-3 align-middle text-left text-[11px] font-semibold uppercase tracking-wide text-[#565959] dark:text-mist lg:px-5'
const TABLE_CELL = 'px-4 py-3.5 align-middle text-left text-sm text-[#0f1111] dark:text-fog lg:px-5'
const TABLE_ROW =
  'h-[3.25rem] transition-colors hover:bg-accent-muted/40 dark:hover:bg-steel/15'

const VIEW_PROFILE_BTN =
  'inline-flex whitespace-nowrap rounded-lg border border-accent bg-white px-3 py-1.5 text-xs font-semibold text-accent shadow-sm transition-colors hover:bg-accent-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:bg-slate dark:hover:bg-accent-muted'

const JOIN_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
]

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

function isStorefrontUser(row) {
  return String(row?.role ?? 'user').toLowerCase() === CUSTOMER_ROLE
}

function parseJoinedDate(row) {
  const iso = row?.createdAt ?? row?.joinedAt ?? row?.created_at
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

function startOfWeek() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfYear() {
  const d = new Date()
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function matchesJoinFilter(row, filterKey) {
  if (filterKey === 'all') return true
  const joined = parseJoinedDate(row)
  if (!joined) return false
  const t = joined.getTime()
  if (filterKey === 'today') {
    return t >= startOfToday().getTime() && t <= endOfToday().getTime()
  }
  if (filterKey === 'week') {
    return t >= startOfWeek().getTime()
  }
  if (filterKey === 'month') {
    return t >= startOfMonth().getTime()
  }
  if (filterKey === 'year') {
    return t >= startOfYear().getTime()
  }
  return true
}

function compareByJoinedDesc(a, b) {
  const ta = parseJoinedDate(a)?.getTime()
  const tb = parseJoinedDate(b)?.getTime()
  if (ta != null && tb != null && ta !== tb) return tb - ta
  if (ta != null && tb == null) return -1
  if (ta == null && tb != null) return 1
  return String(b?.id ?? '').localeCompare(String(a?.id ?? ''))
}

function userDisplayName(row) {
  const name = String(row?.name ?? '').trim()
  if (name) return name
  const phone = String(row?.phone ?? '').trim()
  if (phone) return phone
  return 'User'
}

function userInitials(row) {
  const name = userDisplayName(row)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (name[0] || 'U').toUpperCase()
}

function formatJoinedOn(row) {
  const d = parseJoinedDate(row)
  if (!d) return null
  return {
    date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }),
  }
}

export function AdminUsersPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [phoneForApi, setPhoneForApi] = useState('')
  const [joinFilter, setJoinFilter] = useState('all')

  useEffect(() => {
    const id = window.setTimeout(() => {
      const t = searchInput.trim()
      setPhoneForApi(looksLikePhoneQuery(t) ? t.replace(/\D/g, '') : '')
    }, PHONE_SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [searchInput])

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
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setItems([])
      setHasMore(false)
      setNextPage(1)
    } finally {
      setLoading(false)
    }
  }, [phoneForApi])

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

  const normalizedSearch = searchInput.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    let rows = items.filter(isStorefrontUser)

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

    rows = rows.filter((row) => matchesJoinFilter(row, joinFilter))
    return [...rows].sort(compareByJoinedDesc)
  }, [items, normalizedSearch, phoneForApi, joinFilter])

  return (
    <div className={canvasClass}>
      <div className="mx-auto max-w-[90rem] space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#0f1111] dark:text-fog sm:text-2xl">
              Users
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#565959] dark:text-mist">
              Manage your users and track registrations.
            </p>
          </div>
          <button type="button" onClick={() => void load()} className={`${PRIMARY_BTN} self-start`}>
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-[#d5d9d9] bg-white shadow-[0_2px_8px_rgba(15,17,17,0.08)] dark:border-steel/60 dark:bg-slate dark:shadow-none">
          <div className="w-full min-w-0 border-b border-[#e7e7e7] bg-[#fafafa] px-4 py-4 dark:border-steel/50 dark:bg-ink/10 sm:px-5">
            <div className={FILTER_TOOLBAR_ROW}>
              <div className="relative z-10 min-w-[280px] w-full flex-1">
                <label htmlFor="users-search" className={FILTER_FIELD_LABEL}>
                  Search
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565959] dark:text-mist"
                    aria-hidden
                  />
                  <input
                    id="users-search"
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search users by name, email, or phone number"
                    autoComplete="off"
                    className={`${FILTER_INPUT} pl-10`}
                  />
                </div>
              </div>

              <div className="w-full flex-shrink-0 sm:w-[200px] lg:w-[220px]">
                <label htmlFor="users-join-filter" className={FILTER_FIELD_LABEL}>
                  Filter
                </label>
                <FilterSelect
                  id="users-join-filter"
                  value={joinFilter}
                  onChange={(e) => setJoinFilter(e.target.value)}
                  className="w-full"
                >
                  {JOIN_FILTERS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </FilterSelect>
              </div>
            </div>
          </div>

          <div className="border-b border-[#e7e7e7] bg-white px-4 py-2 dark:border-steel/50 sm:px-5">
            <p className="text-xs text-[#565959] dark:text-mist">
              {loading
                ? 'Loading…'
                : `${filteredItems.length} user${filteredItems.length === 1 ? '' : 's'} shown`}
              {hasMore && !loading ? ' · more available' : ''}
            </p>
          </div>

          {loading ? (
            <p className="px-4 py-16 text-center text-sm text-[#565959] dark:text-mist">Loading users…</p>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted ring-1 ring-accent/25"
                aria-hidden
              >
                <UserRound className="h-7 w-7 text-accent" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-[#0f1111] dark:text-fog">No users found</p>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#565959] dark:text-mist">
                {items.length === 0
                  ? 'New user registrations will appear here.'
                  : 'Try adjusting your search or filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto lg:overflow-x-visible">
              <table className="w-full border-collapse text-left lg:table-fixed">
                <colgroup className="hidden lg:table-column-group">
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '34%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <thead className="sticky top-0 z-10 border-b border-[#e7e7e7] bg-[#fafafa] dark:border-steel/50 dark:bg-ink/15">
                  <tr>
                    <th className={TABLE_TH}>User</th>
                    <th className={TABLE_TH}>Contact</th>
                    <th className={TABLE_TH}>Joined On</th>
                    <th className={`${TABLE_TH} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e7e7] dark:divide-steel/40">
                  {filteredItems.map((row) => {
                    const name = userDisplayName(row)
                    const avatar = resolveApiAssetUrl(row?.avatarUrl)
                    const joined = formatJoinedOn(row)
                    const profilePath = `/admin/users/${encodeURIComponent(row.id)}`

                    return (
                      <tr key={row.id} className={TABLE_ROW}>
                        <td className={TABLE_CELL}>
                          <div className="flex min-w-0 items-center gap-3">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-[#e7e7e7] dark:border-steel/60"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent ring-1 ring-accent/30">
                                {userInitials(row)}
                              </div>
                            )}
                            <span className="truncate font-medium text-[#0f1111] dark:text-fog">{name}</span>
                          </div>
                        </td>
                        <td className={`${TABLE_CELL} py-3`}>
                          {row.phone ? (
                            <span className="inline-flex items-center gap-2 text-sm leading-none text-[#0f1111] dark:text-fog">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-[#565959]" aria-hidden />
                              <span className="font-mono text-[13px]">{row.phone}</span>
                            </span>
                          ) : (
                            <span className="text-sm leading-none text-[#565959] dark:text-mist">—</span>
                          )}
                        </td>
                        <td className={TABLE_CELL}>
                          {joined ? (
                            <div>
                              <p className="font-medium text-[#0f1111] dark:text-fog">{joined.date}</p>
                              <p className="mt-0.5 text-xs text-[#565959] dark:text-mist">{joined.time}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-[#565959] dark:text-mist">—</span>
                          )}
                        </td>
                        <td className={`${TABLE_CELL} text-right`}>
                          <Link to={profilePath} className={VIEW_PROFILE_BTN} title={`View profile for ${name}`}>
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {hasMore ? (
            <div className="flex flex-col items-center gap-2 border-t border-[#e7e7e7] bg-[#fafafa] px-4 py-4 dark:border-steel/50 dark:bg-ink/10 sm:flex-row sm:justify-between">
              <p className="text-xs text-[#565959] dark:text-mist">
                Showing {filteredItems.length} loaded · {PAGE_SIZE} per request
              </p>
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-lg border border-accent bg-white px-5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-muted disabled:opacity-50"
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
