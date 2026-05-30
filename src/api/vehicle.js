import { apiGet, apiPost, apiV1Base } from './client.js'

function requireApi() {
  if (!apiV1Base()) {
    throw new Error('API not configured (set VITE_API_BASE or run Vite dev with Spring on :8080).')
  }
}

export async function fetchVehicleBrands() {
  requireApi()
  const { data } = await apiGet('/vehicle/brands')
  return data.items
}

export async function fetchVehicleModels(brandId) {
  requireApi()
  const { data } = await apiGet(`/vehicle/models?brandId=${encodeURIComponent(brandId)}`)
  return data.items
}

/** @param {{ brandId?: string, modelId?: string }} [params] */
export async function fetchVehicleYears(params = {}) {
  requireApi()
  const q = new URLSearchParams()
  if (params.brandId) q.set('brandId', params.brandId)
  if (params.modelId) q.set('modelId', params.modelId)
  const suffix = q.toString() ? `?${q}` : ''
  const { data } = await apiGet(`/vehicle/years${suffix}`)
  return data.items
}

/** @param {{ brandId?: string, modelId?: string, year?: string }} [params] */
export async function fetchVehicleVariants(params = {}) {
  requireApi()
  const q = new URLSearchParams()
  if (params.brandId) q.set('brandId', params.brandId)
  if (params.modelId) q.set('modelId', params.modelId)
  if (params.year) q.set('year', params.year)
  const suffix = q.toString() ? `?${q}` : ''
  const { data } = await apiGet(`/vehicle/variants${suffix}`)
  return data.items
}

export async function fetchCars() {
  requireApi()
  const { data } = await apiGet('/cars')
  return data.items
}

export async function submitVehicleSearch(body) {
  requireApi()
  return apiPost('/search/vehicle', body)
}
