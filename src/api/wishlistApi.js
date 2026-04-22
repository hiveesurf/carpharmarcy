import { apiGet, apiPost } from './client.js'

export function getWishlist() {
  return apiGet('/wishlist')
}

export function toggleWishlist(productId) {
  return apiPost('/wishlist/toggle', { productId })
}
