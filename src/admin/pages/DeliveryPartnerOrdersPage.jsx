import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, Package } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { deriveDeliveryUiStage } from '../../lib/deliveryUiStage.js'
import { DeliveryOrderCard } from '../components/delivery/DeliveryOrderCard.jsx'
import { DELIVERY_CANVAS, DELIVERY_PRIMARY_BTN, DELIVERY_SHELL_LIST } from '../components/delivery/deliveryTheme.js'

const SEARCH_DEBOUNCE_MS = 350

const STATUS_TABS = [
  { key: 'active', label: 'Active' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered', label: 'Delivered' },
]

function orderMatchesSearch(order, query) {
  if (!query) return true
  const q = query.toLowerCase()
  const hay = [
    order.id,
    order.customerName,
    order.customerPhone,
    order.shippingAddress?.line1,
    order.shippingAddress?.city,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

/** @param {string} uiStage @param {string} tab */
function matchesStatusTab(uiStage, tab) {
  if (uiStage === 'failed') return false
  if (tab === 'active') return uiStage === 'assigned'
  if (tab === 'in_progress') {
    return uiStage !== 'delivered' && uiStage !== 'assigned' && uiStage !== 'failed'
  }
  if (tab === 'delivered') return uiStage === 'delivered'
  return true
}

export function DeliveryPartnerOrdersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState('active')

  useEffect(() => {
    const id = window.setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await adminService.listDeliveryOrders({})
      setItems(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const tabCounts = useMemo(() => {
    const counts = { active: 0, in_progress: 0, delivered: 0 }
    for (const o of items) {
      const ui = deriveDeliveryUiStage(o)
      if (matchesStatusTab(ui, 'active')) counts.active += 1
      if (matchesStatusTab(ui, 'in_progress')) counts.in_progress += 1
      if (matchesStatusTab(ui, 'delivered')) counts.delivered += 1
    }
    return counts
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((o) => {
      if (!orderMatchesSearch(o, searchQuery)) return false
      return matchesStatusTab(deriveDeliveryUiStage(o), tab)
    })
  }, [items, searchQuery, tab])

  return (
    <div className={`${DELIVERY_CANVAS} !pt-2 md:!pt-3`}>
      <div className={`${DELIVERY_SHELL_LIST} gap-2`}>
        <header className="flex items-center justify-between gap-3 pt-0.5">
          <h1 className="font-display text-xl font-bold tracking-tight text-[#0f1111] sm:text-2xl">
            My deliveries
          </h1>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-flare shadow-sm transition hover:bg-flare-muted disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        </header>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888c8c]" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search customer, phone, order…"
            className="h-10 w-full rounded-xl border-0 bg-white pl-9 pr-3 text-sm text-[#0f1111] shadow-[0_1px_4px_rgba(15,17,17,0.08)] outline-none placeholder:text-[#888c8c] focus:ring-2 focus:ring-flare/30"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Delivery status">
          {STATUS_TABS.map(({ key, label }) => {
            const selected = tab === key
            const count = tabCounts[key]
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(key)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition sm:text-sm ${
                  selected
                    ? 'bg-[#0f1111] text-white shadow-sm'
                    : 'bg-white text-[#565959] shadow-[0_1px_3px_rgba(15,17,17,0.06)] hover:text-[#0f1111]'
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    selected ? 'bg-white/20 text-white' : 'bg-[#eaeded] text-[#565959]'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-1.5">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-[4.25rem] animate-pulse rounded-xl bg-white/80 sm:h-[4.5rem]" />
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl bg-white px-4 py-10 text-center shadow-[0_1px_4px_rgba(15,17,17,0.08)]">
              <Package className="h-10 w-10 text-[#888c8c]" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-[#0f1111]">No deliveries</p>
              <p className="mt-1 max-w-xs text-xs text-[#565959]">
                {tab === 'active'
                  ? 'No new assignments right now.'
                  : tab === 'in_progress'
                    ? 'Nothing out for delivery.'
                    : 'No completed deliveries in this view.'}
              </p>
              <button type="button" className={`${DELIVERY_PRIMARY_BTN} mt-4 max-w-xs`} onClick={() => void load()}>
                Refresh
              </button>
            </div>
          ) : (
            filtered.map((o) => <DeliveryOrderCard key={o.id} order={o} />)
          )}
        </div>
      </div>
    </div>
  )
}
