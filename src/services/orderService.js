import * as orderApi from '../api/orderApi.js'
import { apiV1Base } from '../api/client.js'

export async function placeOrder(body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await orderApi.createOrder(body)
  return data.order
}

export async function listOrders({ page = 0, size = 3, phone } = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await orderApi.getOrders({ page, size, phone })
  const items = data?.items
  return {
    items: Array.isArray(items) ? items : [],
    hasMore: Boolean(data?.hasMore),
    nextPage: Number.isFinite(data?.nextPage) ? Number(data.nextPage) : page + 1,
    page: Number.isFinite(data?.page) ? Number(data.page) : page,
    size: Number.isFinite(data?.size) ? Number(data.size) : size,
  }
}

export async function getOrder(id) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await orderApi.getOrderById(id)
  return data.order
}

/** Live delivery OTP snapshot for order owner. */
export async function getDeliveryOtp(orderId) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await orderApi.getDeliveryOtp(orderId)
  return data
}
