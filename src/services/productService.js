import * as productApi from '../api/productApi.js'
import { apiV1Base } from '../api/client.js'

const CACHE_TTL_MS = 45_000
/** @type {Map<string, { t: number, data: unknown }>} */
const catalogCache = new Map()

function requireApi() {
  if (!apiV1Base()) {
    throw new Error('API not configured (set VITE_API_BASE or run Vite dev with Spring on :8080).')
  }
}

function cacheKey(params) {
  return JSON.stringify({
    type: params.type ?? null,
    category: params.category ?? null,
    search: params.search ?? null,
    sort: params.sort ?? null,
    carModel: params.carModel ?? null,
    carId: params.carId ?? null,
    partBrand: params.partBrand ?? null,
    page: params.page ?? 0,
    pageSize: params.pageSize ?? 24,
  })
}

export async function fetchProducts(params = {}) {
  requireApi()
  const key = cacheKey(params)
  const now = Date.now()
  const hit = catalogCache.get(key)
  if (hit && now - hit.t < CACHE_TTL_MS) {
    return hit.data
  }
  const { data } = await productApi.getProducts(params)
  catalogCache.set(key, { t: now, data })
  return data
}

export async function fetchProductById(id) {
  requireApi()
  const { data } = await productApi.getProductById(id)
  return data.product
}

export async function searchProductsQuick(term) {
  return fetchProducts({ search: term, page: 0, pageSize: 24 })
}

export async function fetchVehicles(params = {}) {
  return fetchProducts({ ...params, type: 'vehicle', page: params.page ?? 0, pageSize: params.pageSize ?? 48 })
}
