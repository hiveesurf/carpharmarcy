/** @typedef {'assigned'|'accepted'|'out_for_delivery'|'otp_pending'|'delivered'|'delivery_failed'} DeliveryStage */

export const DELIVERY_STAGE_LABELS = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  out_for_delivery: 'Out for delivery',
  otp_pending: 'OTP pending',
  delivered: 'Delivered',
  delivery_failed: 'Failed',
}

export const DELIVERY_FAILED_REASONS = [
  { value: 'customer_not_available', label: 'Customer Not Available' },
  { value: 'phone_not_reachable', label: 'Phone Not Reachable' },
  { value: 'wrong_address', label: 'Wrong Address' },
  { value: 'customer_refused', label: 'Customer Refused' },
  { value: 'other', label: 'Other' },
]

export function normalizeDeliveryStage(raw) {
  const s = String(raw ?? '').trim().toLowerCase()
  if (!s) return null
  return s.replace(/-/g, '_')
}

export function deliveryStageLabel(stage) {
  const key = normalizeDeliveryStage(stage)
  if (!key) return '—'
  return DELIVERY_STAGE_LABELS[key] || key.replace(/_/g, ' ')
}

export function deliveryTimelineSteps(order) {
  const stage = normalizeDeliveryStage(order?.deliveryStage)
  const failed = stage === 'delivery_failed'
  return [
    { key: 'assigned', label: 'Assigned', at: order?.assignedDeliveryAt },
    { key: 'accepted', label: 'Accepted', at: order?.deliveryAcceptedAt },
    {
      key: 'out_for_delivery',
      label: 'Out for delivery',
      at: order?.deliveryOutForDeliveryAt,
    },
    {
      key: 'otp_verified',
      label: 'OTP verified',
      at: order?.deliveryOtpVerifiedAt,
    },
    {
      key: 'delivered',
      label: failed ? 'Failed' : 'Delivered',
      at: failed ? order?.deliveryFailedAt : order?.deliveryDeliveredAt,
    },
  ]
}

export function isDeliveryStageActive(stage) {
  const s = normalizeDeliveryStage(stage)
  return s && !['delivered', 'delivery_failed'].includes(s)
}

/** Customer-facing: OTP should be shown when stage is otp_pending and not yet verified. */
export function isCustomerDeliveryOtpPending(order) {
  if (order?.deliveryOtpVerified) return false
  if (order?.otpPending === true) return true
  return normalizeDeliveryStage(order?.deliveryStage) === 'otp_pending'
}

export function shouldShowCustomerDeliverySection(order) {
  return Boolean(
    order?.deliveryPartner ||
      order?.deliveryStage ||
      order?.otpPending ||
      isCustomerDeliveryOtpPending(order),
  )
}
