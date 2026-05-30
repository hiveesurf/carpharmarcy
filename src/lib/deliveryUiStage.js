import { normalizeDeliveryStage } from './deliveryStage.js'

/**
 * UI workflow step for delivery partner screens (maps backend stages to guided flow).
 * @typedef {'assigned'|'accepted'|'out_for_delivery'|'otp_pending'|'proof'|'ready_deliver'|'delivered'|'failed'} DeliveryUiStage
 */

export const DELIVERY_UI_STAGE_LABELS = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  out_for_delivery: 'Out for delivery',
  otp_pending: 'OTP pending',
  proof: 'OTP verified',
  ready_deliver: 'Ready to complete',
  delivered: 'Delivered',
  failed: 'Failed',
}

/**
 * @param {object | null | undefined} order
 * @param {{ reached?: boolean }} [opts]
 * @returns {DeliveryUiStage}
 */
export function deriveDeliveryUiStage(order, opts = {}) {
  const stage = normalizeDeliveryStage(order?.deliveryStage)
  const reached = Boolean(opts.reached)
  const otpVerified = Boolean(order?.deliveryOtpVerified)
  const hasProof = Boolean(order?.proofPhotoUrl)

  if (stage === 'delivered') return 'delivered'
  if (stage === 'delivery_failed') return 'failed'
  if (stage === 'assigned') return 'assigned'
  if (stage === 'accepted') return 'accepted'

  if (stage === 'otp_pending' || stage === 'out_for_delivery') {
    if (otpVerified && hasProof) return 'ready_deliver'
    if (otpVerified) return 'proof'
    // Backend sets otp_pending when delivery starts (OTP issued) — do not require local "reached".
    if (stage === 'otp_pending') return 'otp_pending'
    if (!reached) return 'out_for_delivery'
    return 'otp_pending'
  }

  return 'assigned'
}

/** @param {DeliveryUiStage} uiStage */
export function deliveryUiStageBadgeLabel(uiStage) {
  return DELIVERY_UI_STAGE_LABELS[uiStage] || 'Assigned'
}

/** @param {DeliveryUiStage} uiStage */
export function deliveryUiStageBadgeClass(uiStage) {
  switch (uiStage) {
    case 'assigned':
      return 'bg-[#f3f4f6] text-[#565959] ring-[#d5d9d9]'
    case 'accepted':
      return 'bg-flare-muted text-flare ring-flare/35'
    case 'out_for_delivery':
      return 'bg-accent-muted text-accent ring-accent/35'
    case 'otp_pending':
      return 'bg-amber-50 text-amber-900 ring-amber-200/80'
    case 'proof':
    case 'ready_deliver':
      return 'bg-flare-muted text-[#c44f22] ring-flare/30'
    case 'delivered':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    case 'failed':
      return 'bg-red-50 text-red-800 ring-red-200'
    default:
      return 'bg-[#f3f4f6] text-[#565959] ring-[#d5d9d9]'
  }
}

/**
 * @param {object | null | undefined} order
 * @param {DeliveryUiStage} uiStage
 */
export function deliveryWorkflowTimelineState(order, uiStage) {
  const stage = normalizeDeliveryStage(order?.deliveryStage)
  const otpVerified = Boolean(order?.deliveryOtpVerified)
  const failed = stage === 'delivery_failed'

  const stepIndex = {
    assigned: 0,
    accepted: 1,
    out_for_delivery: 2,
    otp_pending: 3,
    proof: 4,
    ready_deliver: 4,
    delivered: 5,
    failed: 5,
  }
  const current = stepIndex[uiStage] ?? 0

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
  ].map((step, idx) => ({
    ...step,
    status: failed && step.key === 'delivered'
      ? 'failed'
      : idx < current
        ? 'done'
        : idx === current
          ? 'current'
          : 'upcoming',
  }))
}

export function formatDeliveryAddress(addr) {
  if (!addr || typeof addr !== 'object') return 'Address not available'
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Address not available'
}

export function isActiveDeliveryOrder(order) {
  const ui = deriveDeliveryUiStage(order)
  return ui !== 'delivered' && ui !== 'failed'
}

/**
 * Whether the partner should be on the OTP entry route (not yet verified).
 * @param {object | null | undefined} order
 * @param {{ reached?: boolean }} [opts]
 */
export function isDeliveryOtpStep(order, opts = {}) {
  if (!order) return false
  if (Boolean(order.deliveryOtpVerified)) return false
  const stage = normalizeDeliveryStage(order.deliveryStage)
  if (stage === 'otp_pending') return true
  return deriveDeliveryUiStage(order, opts) === 'otp_pending'
}

/**
 * Six-step partner progress rail (display only).
 * @param {object | null | undefined} order
 * @param {DeliveryUiStage} uiStage
 */
export function deliveryPartnerProgressSteps(order, uiStage) {
  const failed = normalizeDeliveryStage(order?.deliveryStage) === 'delivery_failed'
  const stepIndex = {
    assigned: 0,
    accepted: 1,
    out_for_delivery: 2,
    otp_pending: 3,
    proof: 4,
    ready_deliver: 4,
    delivered: 5,
    failed: 5,
  }
  const current = stepIndex[uiStage] ?? 0

  return [
    { key: 'assigned', label: 'Assigned', shortLabel: 'Assigned', at: order?.assignedDeliveryAt },
    { key: 'accepted', label: 'Accepted', shortLabel: 'Accepted', at: order?.deliveryAcceptedAt },
    {
      key: 'out_for_delivery',
      label: 'Out For Delivery',
      shortLabel: 'Out',
      at: order?.deliveryOutForDeliveryAt,
    },
    { key: 'otp', label: 'OTP Verified', shortLabel: 'OTP', at: order?.deliveryOtpVerifiedAt },
    { key: 'proof', label: 'Upload Proof', shortLabel: 'Proof', at: order?.proofPhotoUrl ? order?.deliveryOtpVerifiedAt : null },
    {
      key: 'delivered',
      label: failed ? 'Failed' : 'Delivered',
      shortLabel: failed ? 'Failed' : 'Done',
      at: failed ? order?.deliveryFailedAt : order?.deliveryDeliveredAt,
    },
  ].map((step, idx) => ({
    ...step,
    status: failed && step.key === 'delivered'
      ? 'failed'
      : idx < current
        ? 'done'
        : idx === current
          ? 'current'
          : 'upcoming',
  }))
}
