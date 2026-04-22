import * as wishlistApi from '../api/wishlistApi.js'
import { apiV1Base } from '../api/client.js'

export async function loadWishlist() {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await wishlistApi.getWishlist()
  return data.items
}

export async function toggleWishlistProduct(productId) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await wishlistApi.toggleWishlist(productId)
  return data
}
