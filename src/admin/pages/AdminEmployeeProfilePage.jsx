import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Package,
  Search,
  Truck,
} from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { resolveApiAssetUrl } from '../../lib/resolveApiAssetUrl.js'

const CANVAS =
  '-mx-4 min-w-0 rounded-none bg-[#eaeded] px-4 py-5 dark:bg-ink/40 md:-mx-6 md:rounded-xl md:px-6 lg:-mx-0 lg:rounded-xl lg:px-8'

const PAGE_SIZE = 15
const SEARCH_DEBOUNCE_MS = 350

function toYmd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function rangeToday() {
  const t = toYmd(new Date())
  return { from: t, to: t }
}

function rangeThisMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: toYmd(start), to: toYmd(end) }
}

function rangeThisYear() {
  const y = new Date().getFullYear()
  return { from: `${y}-01-01`, to: `${y}-12-31` }
}

function formatInr(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n))
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function employeeAvailabilityLabel(raw) {
  const s = String(raw ?? 'offline').trim().toLowerCase()
  if (s === 'online' || s === 'free') return 'Online'
  if (s === 'busy') return 'Busy'
  if (s === 'offline') return 'Offline'
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Offline'
}

function statusPillClass(status) {
  const s = String(status ?? '').toLowerCase()
  if (s === 'delivered') return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
  if (s === 'cancelled' || s === 'refunded') return 'bg-red-50 text-red-800 ring-red-200'
  if (s === 'shipped') return 'bg-blue-50 text-blue-800 ring-blue-200'
  if (s === 'processing' || s === 'confirmed' || s === 'placed') return 'bg-amber-50 text-amber-800 ring-amber-200'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function KpiCard({ icon: Icon, label, value, iconClass }) {
  return (
    <div className="rounded-xl border border-[#d5d9d9] bg-white p-4 shadow-sm dark:border-steel/60 dark:bg-slate">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#565959] dark:text-mist">{label}</p>
          <p className="mt-1 text-2xl font-bold leading-none text-[#0f1111] dark:text-fog">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      <button type="button" className="mt-2 text-xs font-semibold text-accent hover:brightness-95">
        View details →
      </button>
    </div>
  )
}

function MetaItem({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className="mt-1 break-all text-base font-semibold text-slate-800">{value || '—'}</dd>
    </div>
  )
}

export function AdminEmployeeProfilePage() {
  const { phone: phoneParam } = useParams()
  const phone = phoneParam ? decodeURIComponent(phoneParam) : ''

  const [employee, setEmployee] = useState(null)
  const [employeeLoading, setEmployeeLoading] = useState(true)
  const [employeeError, setEmployeeError] = useState(null)

  const [filterPreset, setFilterPreset] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [appliedFrom, setAppliedFrom] = useState(() => rangeThisMonth().from)
  const [appliedTo, setAppliedTo] = useState(() => rangeThisMonth().to)

  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliveryError, setDeliveryError] = useState(null)
  const [summary, setSummary] = useState({
    assignedCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
    deliverySuccessRate: 0,
  })
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const loadEmployee = useCallback(async () => {
    if (!phone) return
    setEmployeeLoading(true)
    setEmployeeError(null)
    try {
      const row = await adminService.getEmployee(phone)
      setEmployee(row && typeof row === 'object' ? row : null)
    } catch (e) {
      setEmployeeError(getFetchErrorMessage(e))
      setEmployee(null)
    } finally {
      setEmployeeLoading(false)
    }
  }, [phone])

  const loadDelivery = useCallback(
    async (fromDate, toDate, pageIdx, search) => {
      if (!phone) return
      setDeliveryLoading(true)
      setDeliveryError(null)
      try {
        const res = await adminService.getEmployeeDeliveryOrders(phone, {
          fromDate,
          toDate,
          search: search || undefined,
          page: pageIdx,
          size: PAGE_SIZE,
        })
        setSummary(res.summary)
        setOrders(res.orders)
        setPage(res.page)
        setTotalPages(res.totalPages)
        setTotalElements(res.totalElements)
      } catch (e) {
        setDeliveryError(getFetchErrorMessage(e))
        setOrders([])
        setSummary({
          assignedCount: 0,
          shippedCount: 0,
          deliveredCount: 0,
          deliverySuccessRate: 0,
        })
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        setDeliveryLoading(false)
      }
    },
    [phone],
  )

  useEffect(() => {
    void loadEmployee()
  }, [loadEmployee])

  useEffect(() => {
    if (!phone) return
    void loadDelivery(appliedFrom, appliedTo, 0, searchDebounced)
  }, [phone, appliedFrom, appliedTo, searchDebounced, loadDelivery])

  const photo = useMemo(() => resolveApiAssetUrl(employee?.photoUrl), [employee?.photoUrl])

  const computeRangeForApply = () => {
    if (filterPreset === 'today') return rangeToday()
    if (filterPreset === 'month') return rangeThisMonth()
    if (filterPreset === 'year') return rangeThisYear()
    return { from: customFrom.trim(), to: customTo.trim() }
  }

  const applyFilter = () => {
    const { from, to } = computeRangeForApply()
    if (!from || !to) {
      setDeliveryError('Please choose From and To dates for a custom range.')
      return
    }
    setDeliveryError(null)
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  const resetFilters = () => {
    setFilterPreset('month')
    setCustomFrom('')
    setCustomTo('')
    const { from, to } = rangeThisMonth()
    setAppliedFrom(from)
    setAppliedTo(to)
    setSearchInput('')
    setSearchDebounced('')
    setDeliveryError(null)
  }

  const goPrevPage = () => {
    if (page <= 0) return
    const next = page - 1
    void loadDelivery(appliedFrom, appliedTo, next, searchDebounced)
  }

  const goNextPage = () => {
    if (page + 1 >= totalPages) return
    const next = page + 1
    void loadDelivery(appliedFrom, appliedTo, next, searchDebounced)
  }

  const initial = (employee?.name || 'E').trim().charAt(0).toUpperCase()
  const availabilityValue = employeeAvailabilityLabel(employee?.availability)
  const onboardingValue = String(employee?.status ?? 'pending').replace(/_/g, ' ')
  const successRateDisplay =
    typeof summary.deliverySuccessRate === 'number' ? `${summary.deliverySuccessRate}%` : '0%'

  return (
    <div className={CANVAS}>
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/employees"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d5d9d9] bg-white px-4 py-2 text-sm font-medium text-[#565959] shadow-sm hover:bg-[#f7fafa]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to employees
          </Link>
        </div>

        {employeeError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{employeeError}</div>
        ) : null}
        {deliveryError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{deliveryError}</div>
        ) : null}

        {employeeLoading ? (
          <p className="text-sm text-slate-500">Loading employee…</p>
        ) : employee ? (
          <section className="rounded-xl border border-[#d5d9d9] bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-start">
              <div className="flex shrink-0 justify-center lg:justify-start">
                {photo ? (
                  <img src={photo} alt="" className="h-16 w-16 rounded-full border border-[#d5d9d9] object-cover md:h-20 md:w-20" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d5d9d9] bg-[#f7fafa] font-display text-2xl font-bold text-[#0f1111] md:h-20 md:w-20">
                    {initial}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">{employee.name || 'Employee'}</h1>
                <dl className="mt-2 grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 md:mt-3 md:grid-cols-2 xl:grid-cols-3">
                  <MetaItem label="Phone" value={employee.phone || '—'} />
                  <MetaItem label="Email" value={employee.email || '—'} />
                  <MetaItem label="Role" value={String(employee.role ?? '').toUpperCase() || '—'} />
                  <MetaItem label="Availability" value={availabilityValue} />
                  <MetaItem label="Onboarding" value={onboardingValue} />
                  <MetaItem label="First Login" value={formatDate(employee.firstLoginAt)} />
                  <MetaItem label="Last Logout" value={formatDate(employee.lastLogoutAt)} />
                </dl>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-[#d5d9d9] bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[170px] flex-1 md:flex-none">
              <label htmlFor="emp-delivery-filter-preset" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Filter By
              </label>
              <select
                id="emp-delivery-filter-preset"
                value={filterPreset}
                onChange={(e) => {
                  const v = e.target.value
                  setFilterPreset(v)
                  if (v === 'custom') {
                    setCustomFrom(appliedFrom)
                    setCustomTo(appliedTo)
                  }
                }}
                className="h-10 w-full rounded-md border border-[#888c8c] bg-white px-3 text-sm text-[#0f1111] outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20"
              >
                <option value="today">Today</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="min-w-[170px] flex-1 md:flex-none">
              <label htmlFor="emp-delivery-from" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                From Date
              </label>
              <input
                id="emp-delivery-from"
                type="date"
                disabled={filterPreset !== 'custom'}
                value={filterPreset === 'custom' ? customFrom : appliedFrom}
                onChange={(e) => (filterPreset === 'custom' ? setCustomFrom(e.target.value) : null)}
                className="h-10 w-full rounded-md border border-[#888c8c] bg-white px-3 text-sm text-[#0f1111] outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>
            <div className="min-w-[170px] flex-1 md:flex-none">
              <label htmlFor="emp-delivery-to" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                To Date
              </label>
              <input
                id="emp-delivery-to"
                type="date"
                disabled={filterPreset !== 'custom'}
                value={filterPreset === 'custom' ? customTo : appliedTo}
                onChange={(e) => (filterPreset === 'custom' ? setCustomTo(e.target.value) : null)}
                className="h-10 w-full rounded-md border border-[#888c8c] bg-white px-3 text-sm text-[#0f1111] outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>
            <button
              type="button"
              onClick={applyFilter}
              className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-on-accent shadow-sm hover:brightness-95"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#888c8c] bg-white px-5 text-sm font-semibold text-[#0f1111] shadow-sm hover:bg-[#f7fafa]"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={ClipboardList} label="Assigned Orders" value={summary.assignedCount} iconClass="bg-blue-100 text-blue-600" />
          <KpiCard icon={Truck} label="Shipped Orders" value={summary.shippedCount} iconClass="bg-emerald-100 text-emerald-600" />
          <KpiCard icon={Package} label="Delivered Orders" value={summary.deliveredCount} iconClass="bg-violet-100 text-violet-600" />
          <KpiCard icon={CheckCircle2} label="Delivery Success Rate" value={successRateDisplay} iconClass="bg-orange-100 text-orange-600" />
        </section>

        <section className="overflow-hidden rounded-xl border border-[#d5d9d9] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#e3e6e6] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#565959]">Recent Assigned Orders</h2>
              <p className="mt-1 text-xs text-[#565959]">
                {appliedFrom} to {appliedTo}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565959]" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search order ID or customer"
                  className="h-10 w-full rounded-md border border-[#888c8c] bg-white py-2 pl-9 pr-3 text-sm text-[#0f1111] outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20"
                  aria-label="Search orders"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e3e6e6] bg-[#f7fafa] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#565959]">
                  <th className="px-4 py-2.5">Order ID</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Delivered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e6e6]">
                {deliveryLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#565959]">
                      Loading orders…
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#565959]">
                      No orders for this filter.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.orderId} className="text-[#0f1111] hover:bg-[#f7fafa]">
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[#0f1111]">{o.orderId}</td>
                      <td className="px-4 py-2.5 font-medium text-[#0f1111]">{o.customerName || '—'}</td>
                      <td className="px-4 py-2.5 text-[#565959]">{formatDate(o.orderDate)}</td>
                      <td className="px-4 py-2.5 font-semibold text-[#0f1111]">{formatInr(o.amount)}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase ring-1 ${statusPillClass(o.status)}`}
                        >
                          {o.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#565959]">{formatDate(o.deliveredDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e6e6] px-4 py-3">
              <p className="text-xs text-[#565959]">
                Page {page + 1} of {totalPages}
                {totalElements ? ` · ${totalElements} orders` : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrevPage}
                  disabled={page <= 0 || deliveryLoading}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d5d9d9] bg-white text-[#565959] disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-accent px-2.5 text-xs font-semibold text-on-accent">
                  {page + 1}
                </span>
                <button
                  type="button"
                  onClick={goNextPage}
                  disabled={page + 1 >= totalPages || deliveryLoading}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d5d9d9] bg-white text-[#565959] disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
