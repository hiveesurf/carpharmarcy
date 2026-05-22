/** Canonical storefront order statuses (matches backend OrderStatus enum). */
export const ORDER_STATUSES = [
  'draft',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

/** Admin orders list / toolbar filters. */
export const ORDER_STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'Placed' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
]

export const ORDER_STATUS_FILTER_LABELS = Object.fromEntries(
  ORDER_STATUS_FILTERS.map((f) => [f.key, f.label]),
)

export function normalizeOrderStatus(raw) {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'dispatched') return 'shipped'
  if (s === 'refund') return 'refunded'
  if (s === 'deliverd') return 'delivered'
  return s
}

/** Pending in admin UI = draft orders (awaiting checkout / payment). */
export function isPendingOrderStatus(statusRaw) {
  return normalizeOrderStatus(statusRaw) === 'draft'
}

export function matchesStatusTab(statusRaw, tabKey) {
  const status = normalizeOrderStatus(statusRaw)
  if (tabKey === 'all') return true
  if (tabKey === 'refund' || tabKey === 'refunded') {
    return status === 'refund' || status === 'refunded'
  }
  if (tabKey === 'pending') return status === 'draft'
  if (tabKey === 'placed') return status === 'placed' || status === 'created'
  if (tabKey === 'confirmed') return status === 'confirmed'
  if (tabKey === 'delivered') return status === 'delivered'
  return status === tabKey
}

export function matchesProfileStatusFilter(statusRaw, filterKey) {
  if (filterKey === 'recent') return true
  return matchesStatusTab(statusRaw, filterKey)
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function startOfLast7DaysUtc() {
  return new Date(Date.now() - 7 * MS_PER_DAY)
}

export function isOrderPlacedWithinLast7Days(orderDateIso) {
  if (!orderDateIso) return false
  const d = new Date(orderDateIso)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() >= startOfLast7DaysUtc().getTime()
}

export function filterOrdersLast7Days(orders) {
  const since = startOfLast7DaysUtc().getTime()
  return (Array.isArray(orders) ? orders : []).filter((o) => {
    const d = new Date(o?.date ?? o?.createdAt ?? o?.placedAt ?? '')
    return !Number.isNaN(d.getTime()) && d.getTime() >= since
  })
}

export function buildOrderSummaryCounts(orders) {
  const counts = {
    total: orders.length,
    placed: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  }
  for (const o of orders) {
    const s = normalizeOrderStatus(o?.status)
    if (s === 'refunded') counts.refunded += 1
    else if (isPendingOrderStatus(s)) counts.pending += 1
    else if (s === 'placed' || s === 'created') counts.placed += 1
    else if (s === 'confirmed') counts.confirmed += 1
    else if (s === 'processing') counts.processing += 1
    else if (s === 'shipped') counts.shipped += 1
    else if (matchesStatusTab(s, 'delivered')) counts.delivered += 1
    else if (s === 'cancelled') counts.cancelled += 1
  }
  return { ...counts, refund: counts.refunded }
}
