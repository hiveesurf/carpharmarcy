import { useCallback, useEffect, useMemo, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { resolveApiAssetUrl } from '../../lib/resolveApiAssetUrl.js'
import { useAuth } from '../../context/useAuth.js'

const STATUSES = [
  'draft',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

const ORDER_STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refund', label: 'Refund' },
]
const PAGE_SIZE = 5

function formatInr(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n))
}

function statusStyle(s) {
  switch (s) {
    case 'delivered':
      return 'bg-accent-muted text-accent ring-accent/35'
    case 'cancelled':
    case 'refunded':
      return 'bg-flare-muted text-flare ring-flare/30'
    case 'shipped':
    case 'processing':
      return 'bg-hud/15 text-hud ring-hud/35'
    default:
      return 'bg-steel/50 text-mist ring-steel/60'
  }
}

export function AdminOrdersPage() {
  const { sessionRole } = useAuth()
  const isDelivery = sessionRole === 'delivery'
  const isSuperAdmin = sessionRole === 'super_admin'
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [deliveryEmployees, setDeliveryEmployees] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDelivery) {
        const list = await adminService.listDeliveryOrders()
        setItems(list)
        setHasMore(false)
        setNextPage(1)
      } else {
        const result = await adminService.listOrders({ page: 0, size: PAGE_SIZE })
        setItems(result.items || [])
        setHasMore(Boolean(result.hasMore))
        setNextPage(Number.isFinite(result.nextPage) ? result.nextPage : 1)
      }
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setItems([])
      setHasMore(false)
      setNextPage(1)
    } finally {
      setLoading(false)
    }
  }, [isDelivery])

  const loadMore = useCallback(async () => {
    if (isDelivery || loadingMore || !hasMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const result = await adminService.listOrders({ page: nextPage, size: PAGE_SIZE })
      setItems((prev) => [...prev, ...(result.items || [])])
      setHasMore(Boolean(result.hasMore))
      setNextPage(Number.isFinite(result.nextPage) ? result.nextPage : nextPage + 1)
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setLoadingMore(false)
    }
  }, [isDelivery, loadingMore, hasMore, nextPage])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!isSuperAdmin) return
    ;(async () => {
      try {
        const list = await adminService.listEmployees()
        setDeliveryEmployees(
          (Array.isArray(list) ? list : []).filter(
            (e) => String(e?.role || '').toLowerCase() === 'delivery',
          ),
        )
      } catch {
        setDeliveryEmployees([])
      }
    })()
  }, [isSuperAdmin])

  useEffect(() => {
    ;(async () => {
      try {
        const list = await adminService.listUsers()
        setUsers(Array.isArray(list) ? list : [])
      } catch {
        setUsers([])
      }
    })()
  }, [])

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const suggestions = useMemo(() => {
    if (!normalizedSearch || selectedUserId) return []
    return users
      .filter((u) => {
        const id = String(u?.id || '').toLowerCase()
        const name = String(u?.name || '').toLowerCase()
        return id.includes(normalizedSearch) || name.includes(normalizedSearch)
      })
      .slice(0, 8)
  }, [users, normalizedSearch])

  const filteredItems = useMemo(() => {
    return items.filter((o) => {
      const status = String(o?.status || '').toLowerCase()
      if (statusFilter !== 'all') {
        const statusOk =
          statusFilter === 'refund'
            ? status === 'refund' || status === 'refunded'
            : statusFilter === 'placed'
              ? status === 'placed' || status === 'created' || status === 'confirmed'
              : statusFilter === 'delivered'
                ? status === 'delivered' || status === 'deliverd'
                : status === statusFilter
        if (!statusOk) return false
      }
      if (selectedUserId) {
        return String(o?.userId || '') === selectedUserId
      }
      if (!normalizedSearch) return true
      const orderUserId = String(o?.userId || '').toLowerCase()
      const orderUserName = String(o?.customerName || '').toLowerCase()
      return orderUserId.includes(normalizedSearch) || orderUserName.includes(normalizedSearch)
    })
  }, [items, statusFilter, normalizedSearch, selectedUserId])

  async function changeStatus(order, status) {
    if (status === order.status) return
    setBusyId(order.id)
    try {
      const updated = await adminService.patchOrderStatus(order.id, status)
      if (updated) {
        setItems((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)))
      } else {
        await load()
      }
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  async function assign(orderId, deliveryAdminEmail) {
    if (!deliveryAdminEmail) return
    try {
      await adminService.assignDelivery(orderId, deliveryAdminEmail)
      setItems((prev) => prev.map((o) => (o.id === orderId ? { ...o, assignedDeliveryAdminEmail: deliveryAdminEmail } : o)))
      setDeliveryEmployees((prev) =>
        prev.map((employee) =>
          employee.email === deliveryAdminEmail
            ? { ...employee, availability: 'busy' }
            : employee,
        ),
      )
    } catch (e) {
      setError(getFetchErrorMessage(e))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-fog md:text-3xl">
            Orders
          </h1>
          <p className="text-sm text-mist">
            Fulfillment queue — update status as orders progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="self-start rounded-xl border border-steel/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent"
        >
          Refresh
        </button>
      </div>

      {!loading && items.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    active
                      ? 'border-accent/50 bg-accent/20 text-accent'
                      : 'border-steel/70 bg-ink/60 text-mist hover:border-hud/50 hover:text-fog'
                  }`}
                  aria-pressed={active}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className="relative z-30 max-w-xl">
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedUserId('')
              }}
              placeholder="Search by user name or user ID"
              className="w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2 font-sans text-sm text-fog placeholder:text-mist/80 focus:border-accent/50 focus:outline-none"
            />
            {selectedUserId ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId('')
                  setSearchQuery('')
                }}
                className="mt-2 rounded-lg border border-steel/70 bg-ink/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-hud/50 hover:text-fog"
              >
                Clear selected user
              </button>
            ) : null}
            {suggestions.length > 0 ? (
              <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-steel/70 bg-ink/95 shadow-xl pointer-events-auto">
                <ul className="max-h-72 overflow-auto">
                  {suggestions.map((u) => {
                    const avatar = resolveApiAssetUrl(u?.avatarUrl)
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            // Use mouse down so selection applies before input blur.
                            e.preventDefault()
                            setSelectedUserId(String(u.id || ''))
                            setSearchQuery(`${u.name || ''}`.trim() || String(u.id || ''))
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate/40"
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt=""
                              className="h-8 w-8 rounded-full border border-steel/60 object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-steel/60 bg-steel/25 font-mono text-[10px] uppercase text-mist">
                              {(String(u?.name || 'U').trim()[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate font-sans text-sm text-fog">
                              {u?.name?.trim() ? u.name : 'User'}
                            </span>
                            <span className="block truncate font-mono text-[10px] text-mist">
                              {u.id}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {error && (
        <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">
          {error}
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-mist">Loading orders…</p>
      ) : (
        <div className="space-y-4">
          {items.length === 0 && (
            <p className="admin-card px-5 py-10 text-center text-mist">
              No orders yet.
            </p>
          )}
          {items.length > 0 && filteredItems.length === 0 && (
            <p className="admin-card px-5 py-10 text-center text-mist">
              No orders found for selected filters.
            </p>
          )}
          {filteredItems.map((o) => (
            <article
              key={o.id}
              className="admin-card overflow-hidden"
            >
              <div className="flex flex-col gap-4 border-b border-steel/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-mist">{o.id}</p>
                  <p className="mt-1 text-sm text-fog">
                    <span className="font-semibold">
                      {o.customerName?.trim() ? o.customerName : 'Customer'}
                    </span>
                    {o.customerPhone ? (
                      <span className="text-mist">
                        {' '}
                        · <span className="font-mono text-fog">{o.customerPhone}</span>
                      </span>
                    ) : null}
                    {o.customerEmail ? (
                      <span className="text-mist">
                        {' '}
                        · {o.customerEmail}
                      </span>
                    ) : null}
                    {o.customerRole ? (
                      <span className="ml-1 rounded-md bg-steel/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist">
                        {o.customerRole}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-mist/90">
                    User id <span className="text-mist">{o.userId}</span>
                    <span className="mx-2 text-steel">·</span>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ring-1 ${statusStyle(o.status)}`}
                  >
                    {o.status}
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums text-fog">
                    {formatInr(o.total)}
                  </span>
                  <select
                    value={o.status}
                    disabled={busyId === o.id}
                    onChange={(e) => changeStatus(o, e.target.value)}
                    className="rounded-lg border border-steel/80 bg-ink/40 px-2 py-1.5 font-mono text-[11px] text-fog focus:border-accent/50 focus:outline-none disabled:opacity-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {isSuperAdmin ? (
                    <select
                      value={o.assignedDeliveryAdminEmail || ''}
                      onChange={(e) => assign(o.id, e.target.value)}
                      className="rounded-lg border border-steel/80 bg-ink/40 px-2 py-1.5 font-mono text-[11px] text-fog"
                    >
                      <option value="">Assign delivery</option>
                      {deliveryEmployees
                        .filter((d) => {
                          const availability = String(d?.availability || '').toLowerCase()
                          return availability === 'free' || d.email === o.assignedDeliveryAdminEmail
                        })
                        .map((d) => (
                          <option key={d.email} value={d.email}>
                            {(d.name || d.email) + ` (${d.availability || 'offline'})`}
                          </option>
                        ))}
                    </select>
                  ) : null}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="font-mono text-[10px] uppercase tracking-wider text-mist">
                      <th className="px-5 py-2 font-medium">Product</th>
                      <th className="px-5 py-2 font-medium text-right">Qty</th>
                      <th className="px-5 py-2 font-medium text-right">Unit</th>
                      <th className="px-5 py-2 font-medium text-right">Line</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel/40 text-mist">
                    {(o.lines || []).map((line, i) => (
                      <tr key={`${o.id}-${i}`}>
                        <td className="px-5 py-2 text-fog">
                          <span className="font-medium">{line.productName || line.productId}</span>
                          {line.sku ? (
                            <span className="mt-0.5 block font-mono text-[10px] text-mist">{line.sku}</span>
                          ) : null}
                        </td>
                        <td className="px-5 py-2 text-right tabular-nums">{line.quantity}</td>
                        <td className="px-5 py-2 text-right tabular-nums">{formatInr(line.unitPrice)}</td>
                        <td className="px-5 py-2 text-right tabular-nums text-fog">
                          {formatInr(line.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
          {!isDelivery && hasMore ? (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-xl border border-accent/40 bg-accent/15 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
