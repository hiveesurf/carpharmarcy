import { apiGet, apiPost } from './client.js'

export function createOrder(body = {}) {
  return apiPost('/orders', body)
}

export function getOrders({ page = 0, size = 3, phone } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  if (phone) params.set('phone', phone)
  return apiGet(`/orders?${params.toString()}`)
}

export function getOrderById(id) {
  return apiGet(`/orders/${encodeURIComponent(id)}`)
}
