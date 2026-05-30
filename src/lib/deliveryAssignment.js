import { normalizeDeliveryStage } from './deliveryStage.js'
import { normalizeOrderStatus } from './orderStatus.js'

/**
 * @param {object | null | undefined} order
 * @param {Map<string, { name?: string, email?: string }>} [employeeByEmail]
 */
export function assigneeLabel(order, employeeByEmail) {
  const email = String(order?.assignedDeliveryAdminEmail ?? '').trim()
  if (!email) return 'Unassigned'
  const emp = employeeByEmail?.get?.(email.toLowerCase())
  return emp?.name?.trim() || email
}

/**
 * Delivered orders must not allow reassignment in admin UI.
 * @param {object | null | undefined} order
 */
export function isOrderDeliveryAssignmentLocked(order) {
  if (!order) return false
  if (normalizeOrderStatus(order.status) === 'delivered') return true
  if (normalizeDeliveryStage(order.deliveryStage) === 'delivered') return true
  if (order.deliveryDeliveredAt) return true
  return false
}

/**
 * Admin UI label when delivery is complete (keeps assignee name visible).
 * @param {object} order
 * @param {Map<string, { name?: string }>} [employeeByEmail]
 */
export function assigneeDisplayLabel(order, employeeByEmail) {
  const name = assigneeLabel(order, employeeByEmail)
  if (!isOrderDeliveryAssignmentLocked(order) || name === 'Unassigned') return name
  return `${name} — Delivered`
}

/**
 * Plain-text label for exports and non-React surfaces.
 * @param {object} order
 * @param {Map<string, { name?: string }>} [employeeByEmail]
 */
export function assigneeLabelForExport(order, employeeByEmail) {
  const name = assigneeLabel(order, employeeByEmail)
  if (!isOrderDeliveryAssignmentLocked(order) || name === 'Unassigned') return name
  return `${name} (DELIVERED)`
}
