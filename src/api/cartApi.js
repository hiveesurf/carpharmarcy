import { apiDelete, apiGet, apiPost, apiPut } from './client.js'

export function getCart() {
  return apiGet('/cart')
}

export function deleteEntireCart() {
  return apiDelete('/cart')
}

export function postCart(productId, quantity = 1) {
  return apiPost('/cart', { productId, quantity })
}

export function putCartItem(itemId, quantity) {
  return apiPut(`/cart/${encodeURIComponent(itemId)}`, { quantity })
}

export function deleteCartItem(itemId) {
  return apiDelete(`/cart/${encodeURIComponent(itemId)}`)
}
