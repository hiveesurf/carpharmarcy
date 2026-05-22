import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ShoppingBag, IndianRupee, TrendingUp, Package, Clock, Radio, AlertTriangle } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { useAuth } from '../../context/useAuth.js'

function formatInr(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n))
}

const statMeta = [
  { key: 'totalUsers', label: 'Users', icon: Users, accent: 'text-hud' },
  { key: 'totalOrders', label: 'Orders', icon: ShoppingBag, accent: 'text-accent' },
  { key: 'revenue', label: 'Revenue', icon: IndianRupee, accent: 'text-flare', format: formatInr },
  { key: 'purchaseCount', label: 'Purchases', icon: ShoppingBag, accent: 'text-hud' },
  { key: 'purchaseValue', label: 'Purchase value', icon: IndianRupee, accent: 'text-accent', format: formatInr },
]

function formatCompactInr(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(n))
}

function normalizeChartRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => ({
      period: String(r?.period ?? ''),
      revenue: Number(r?.revenue ?? 0),
      purchases: Number(r?.purchases ?? 0),
    }))
    .filter((r) => r.period)
}

function RevenuePurchasesChart({ rows }) {
  const width = 900
  const height = 260
  const paddingX = 26
  const paddingTop = 20
  const paddingBottom = 28
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingTop - paddingBottom
  const maxY = Math.max(1, ...rows.map((r) => r.revenue), ...rows.map((r) => r.purchases))
  const denom = Math.max(1, rows.length - 1)
  const toX = (i) => paddingX + (chartWidth * i) / denom
  const toY = (v) => paddingTop + chartHeight - (v / maxY) * chartHeight

  const linePath = (key) =>
    rows
      .map((row, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(row[key]).toFixed(2)}`)
      .join(' ')

  const tickValues = [0.25, 0.5, 0.75, 1].map((f) => maxY * f)
  const lastLabels = rows.length > 6 ? rows.slice(-6) : rows

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-accent">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Revenue
        </span>
        <span className="inline-flex items-center gap-1.5 text-hud">
          <span className="h-2 w-2 rounded-full bg-hud" />
          Purchases
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[640px] w-full">
          {tickValues.map((v) => {
            const y = toY(v)
            return (
              <g key={v}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} className="stroke-steel/35" />
                <text x={paddingX} y={y - 4} className="fill-mist text-[10px] font-mono">
                  {formatCompactInr(v)}
                </text>
              </g>
            )
          })}
          <line
            x1={paddingX}
            y1={paddingTop + chartHeight}
            x2={width - paddingX}
            y2={paddingTop + chartHeight}
            className="stroke-steel/50"
          />
          <path d={linePath('revenue')} fill="none" className="stroke-accent" strokeWidth="2.5" />
          <path d={linePath('purchases')} fill="none" className="stroke-hud" strokeWidth="2.5" />
          {lastLabels.map((row, idx) => {
            const originalIndex = rows.length > 6 ? rows.length - 6 + idx : idx
            return (
              <text
                key={row.period}
                x={toX(originalIndex)}
                y={height - 8}
                textAnchor="middle"
                className="fill-mist text-[10px] font-mono"
              >
                {row.period}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function formatTs(iso) {
  if (iso == null || String(iso).trim() === '') return '—'
  const d = new Date(String(iso))
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString()
}

/** Backend availability_status → dashboard label (uppercase; legacy `free` treated as online). */
function availabilityLabel(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (s === 'online' || s === 'free') return 'ONLINE'
  if (s === 'busy') return 'BUSY'
  if (s === 'offline') return 'OFFLINE'
  return s ? s.toUpperCase() : '—'
}

export function AdminOverviewPage() {
  const { sessionRole } = useAuth()
  const isSales = sessionRole === 'sales'
  const isDelivery = sessionRole === 'delivery'
  const [data, setData] = useState(null)
  const [deliverySummary, setDeliverySummary] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [availabilitySaving, setAvailabilitySaving] = useState(null)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        if (isDelivery) {
          const d = await adminService.deliveryPartnerSummary()
          if (!cancel) {
            setDeliverySummary(d && typeof d === 'object' ? d : {})
            setData(null)
          }
        } else {
          const d = await adminService.dashboard()
          if (!cancel) {
            setData(d)
            setDeliverySummary(null)
          }
        }
      } catch (e) {
        if (!cancel) {
          setError(getFetchErrorMessage(e))
          setData(null)
          setDeliverySummary(null)
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [isDelivery])

  useEffect(() => {
    if (!isDelivery) return
    const refresh = () => {
      void (async () => {
        try {
          const d = await adminService.deliveryPartnerSummary()
          setDeliverySummary(d && typeof d === 'object' ? d : {})
        } catch {
          /* keep prior summary; orders page will show API errors */
        }
      })()
    }
    window.addEventListener('carnalysys:delivery-stats-refresh', refresh)
    return () => window.removeEventListener('carnalysys:delivery-stats-refresh', refresh)
  }, [isDelivery])

  async function setDeliveryAvailability(next) {
    if (!isDelivery || (next !== 'online' && next !== 'offline')) return
    setAvailabilitySaving(next)
    setError(null)
    try {
      await adminService.setMyDeliveryAvailability(next)
      const d = await adminService.deliveryPartnerSummary()
      setDeliverySummary(d && typeof d === 'object' ? d : {})
      window.dispatchEvent(new Event('carnalysys:delivery-stats-refresh'))
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setAvailabilitySaving(null)
    }
  }

  if (isDelivery) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-fog md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-mist">
            Completed deliveries assigned to you and your last session times.
          </p>
        </div>

        {loading && <p className="font-mono text-xs text-mist">Loading dashboard…</p>}
        {error && (
          <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">{error}</div>
        )}

        {deliverySummary && !error && (
          <>
            <section className="admin-card relative overflow-hidden p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <Radio className="mt-0.5 h-8 w-8 shrink-0 text-accent opacity-90" strokeWidth={1.5} />
                  <div>
                    <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">My availability</h2>
                    <p className="mt-2 font-display text-2xl font-bold tracking-tight text-fog">
                      Current status:{' '}
                      <span className="text-accent">
                        {availabilityLabel(deliverySummary.availability)}
                      </span>
                    </p>
                    <p className="mt-1 max-w-xl text-xs text-mist">
                      Online and Offline are set by you. Busy is set when an order is assigned to you.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={
                      availabilitySaving !== null ||
                      String(deliverySummary.availability ?? '')
                        .trim()
                        .toLowerCase() === 'online'
                    }
                    onClick={() => void setDeliveryAvailability('online')}
                    className="rounded-xl bg-accent px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {availabilitySaving === 'online' ? 'Updating…' : 'Set online'}
                  </button>
                  <button
                    type="button"
                    disabled={
                      availabilitySaving !== null ||
                      String(deliverySummary.availability ?? '')
                        .trim()
                        .toLowerCase() === 'offline'
                    }
                    onClick={() => void setDeliveryAvailability('offline')}
                    className="rounded-xl border border-steel/80 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {availabilitySaving === 'offline' ? 'Updating…' : 'Set offline'}
                  </button>
                </div>
              </div>
            </section>
            <ul className="grid gap-4 sm:grid-cols-3">
            <li className="admin-card relative overflow-hidden p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">Deliveries done</p>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums text-fog">
                    {deliverySummary.deliveriesDone ?? 0}
                  </p>
                  <p className="mt-2 text-xs text-mist">Status delivered · assigned to you</p>
                </div>
                <Package className="h-8 w-8 shrink-0 text-accent opacity-90" strokeWidth={1.5} />
              </div>
            </li>
            <li className="admin-card relative overflow-hidden p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">Last login</p>
                  <p className="mt-2 font-sans text-sm leading-snug text-fog">{formatTs(deliverySummary.lastLoginAt)}</p>
                </div>
                <Clock className="h-8 w-8 shrink-0 text-hud opacity-90" strokeWidth={1.5} />
              </div>
            </li>
            <li className="admin-card relative overflow-hidden p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">Last logout</p>
                  <p className="mt-2 font-sans text-sm leading-snug text-fog">{formatTs(deliverySummary.lastLogoutAt)}</p>
                </div>
                <Clock className="h-8 w-8 shrink-0 text-mist opacity-90" strokeWidth={1.5} />
              </div>
            </li>
          </ul>
          </>
        )}
      </div>
    )
  }

  const top = Array.isArray(data?.topProducts) ? data.topProducts : []
  const chartRows = normalizeChartRows(data?.revenueVsPurchases)
  const stats = statMeta.filter((s) => !(isSales && (s.key === 'revenue' || s.key === 'purchaseValue')))
  const lowStockCount = Number(data?.lowStockCount ?? 0)
  const lowStockThreshold = Number(data?.lowStockThreshold ?? 5)
  const showLowStockAlert =
    !isDelivery && lowStockCount > 0 && (sessionRole === 'super_admin' || sessionRole === 'sales')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-fog md:text-3xl">
          Analytics
        </h1>
        <p className="mt-1 max-w-xl text-sm text-mist">
          Store performance at a glance. Use the sidebar to manage products, categories, and orders — same look as
          the main site.
        </p>
      </div>

      {loading && <p className="font-mono text-xs text-mist">Loading dashboard…</p>}
      {error && (
        <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">{error}</div>
      )}

      {data && !error && (
        <>
          {showLowStockAlert ? (
            <div className="flex flex-col gap-2 rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm text-fog">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-flare" strokeWidth={1.75} aria-hidden />
                <span>
                  <span className="font-medium text-flare">Low stock:</span> {lowStockCount} product
                  {lowStockCount === 1 ? '' : 's'} at or below {lowStockThreshold} units.
                </span>
              </p>
              <Link
                to="/admin/products?lowStock=1"
                className="shrink-0 self-start rounded-lg border border-flare/40 bg-ink/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-flare transition-colors hover:bg-flare-muted sm:self-center"
              >
                Review inventory
              </Link>
            </div>
          ) : null}

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map(({ key, label, icon: Icon, accent, format }) => {
              const raw = data[key]
              const display = format ? format(raw) : String(raw ?? '—')
              return (
                <li
                  key={key}
                  className="admin-card relative overflow-hidden p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">{label}</p>
                      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-fog">{display}</p>
                    </div>
                    <Icon className={`h-8 w-8 shrink-0 opacity-90 ${accent}`} strokeWidth={1.5} />
                  </div>
                </li>
              )
            })}
            <li className="relative overflow-hidden rounded-2xl border border-accent/30 bg-accent-muted p-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-8 w-8 shrink-0 text-accent" strokeWidth={1.5} />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">Top catalog</p>
                  <p className="mt-2 text-sm text-mist">
                    Published highlights.{' '}
                    <Link to="/admin/products" className="font-semibold text-accent underline-offset-2 hover:underline">
                      Add or edit products
                    </Link>
                  </p>
                </div>
              </div>
            </li>
          </ul>

          {!isSales ? <section className="admin-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-steel/50 px-5 py-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-mist">
                Revenue vs purchases (all-time)
              </h2>
            </div>
            <div className="px-5 py-4">
              {chartRows.length > 0 ? (
                <RevenuePurchasesChart rows={chartRows} />
              ) : (
                <p className="text-sm text-mist">No purchase data available yet.</p>
              )}
            </div>
          </section> : null}

          <section className="admin-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-steel/50 px-5 py-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-mist">
                Top products (published)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-steel/50 font-mono text-[10px] uppercase tracking-wider text-mist">
                    <th className="px-5 py-3 font-medium">SKU</th>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel/40">
                  {top.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-mist">
                        No products in dashboard sample.
                      </td>
                    </tr>
                  )}
                  {top.map((p) => (
                    <tr key={p.id} className="text-mist hover:bg-steel/25">
                      <td className="px-5 py-3 font-mono text-xs text-mist">{p.sku ?? p.id}</td>
                      <td className="px-5 py-3 font-medium text-fog">{p.name}</td>
                      <td className="px-5 py-3 text-mist">{p.category}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-fog">{formatInr(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
