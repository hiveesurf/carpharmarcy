import { apiGet } from './client.js'

function toQuery(params = {}) {
  const q = new URLSearchParams()
  if (params.category) q.set('category', params.category)
  if (params.search) q.set('search', params.search)
  if (params.sort) q.set('sort', params.sort)
  if (params.carModel) q.set('carModel', params.carModel)
  if (params.carId) q.set('carId', params.carId)
  if (params.partBrand) q.set('partBrand', params.partBrand)
  if (params.type) q.set('type', params.type)
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function getProducts(params) {
  return apiGet(`/products${toQuery(params)}`)
}

export function getProductById(id) {
  return apiGet(`/products/${encodeURIComponent(id)}`)
}
