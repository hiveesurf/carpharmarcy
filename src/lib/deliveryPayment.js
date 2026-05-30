import { formatInr } from '../data/partsCatalog.js'

/**
 * @typedef {'cod' | 'paid' | 'online_pending'} DeliveryPaymentKind
 */

/**
 * @typedef {{
 *   kind: DeliveryPaymentKind,
 *   badgeText: string,
 *   badgeSub?: string,
 *   showAmountToCollect: boolean,
 *   amountFormatted: string | null,
 * }} DeliveryPaymentInfo
 */

const ONLINE_METHODS = new Set(['upi', 'card', 'netbanking', 'wallet'])

/**
 * @param {object | null | undefined} order
 * @returns {number | null}
 */
export function resolveOrderAmount(order) {
  if (!order || typeof order !== 'object') return null
  const candidates = [order.total, order.totalAmount, order.orderAmount, order.amount]
  for (const c of candidates) {
    if (c == null || c === '') continue
    const n = Number(c)
    if (!Number.isNaN(n) && n >= 0) return n
  }
  return null
}

/**
 * @param {object | null | undefined} order
 * @returns {string | null}
 */
export function formatOrderAmount(order) {
  const n = resolveOrderAmount(order)
  if (n == null) return null
  return formatInr(n)
}

/**
 * COD vs prepaid/paid display for delivery partner screens.
 * @param {object | null | undefined} order
 * @returns {DeliveryPaymentInfo}
 */
export function resolveDeliveryPayment(order) {
  const method = String(order?.paymentMethod ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
  const status = String(order?.paymentStatus ?? '')
    .trim()
    .toLowerCase()

  const isPaid = status === 'paid' || status === 'authorized'
  const isCod = method === 'cod'
  const amountFormatted = formatOrderAmount(order)

  if (isPaid) {
    return {
      kind: 'paid',
      badgeText: 'Paid',
      showAmountToCollect: false,
      amountFormatted: null,
    }
  }

  if (isCod) {
    return {
      kind: 'cod',
      badgeText: 'COD',
      badgeSub: 'Cash on Delivery',
      showAmountToCollect: true,
      amountFormatted,
    }
  }

  if (ONLINE_METHODS.has(method)) {
    return {
      kind: 'online_pending',
      badgeText: 'Online',
      showAmountToCollect: false,
      amountFormatted: null,
    }
  }

  return {
    kind: 'online_pending',
    badgeText: isPaid ? 'Paid' : 'Online',
    showAmountToCollect: false,
    amountFormatted: null,
  }
}

/**
 * @param {string | null | undefined} name
 */
export function customerInitials(name) {
  const parts = String(name ?? 'Customer')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return 'C'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
