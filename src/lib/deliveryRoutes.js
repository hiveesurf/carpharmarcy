export const DELIVERY_LIST_PATH = '/admin/deliveries'

export function deliveryDetailPath(orderId) {
  return `/admin/deliveries/${encodeURIComponent(orderId)}`
}

export function deliveryOtpPath(orderId) {
  return `/admin/deliveries/${encodeURIComponent(orderId)}/otp`
}

export function deliveryProofPath(orderId) {
  return `/admin/deliveries/${encodeURIComponent(orderId)}/proof`
}

export function deliverySuccessPath(orderId) {
  return `/admin/deliveries/${encodeURIComponent(orderId)}/success`
}
