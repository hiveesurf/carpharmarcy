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

export async function fetchVehicleYears() {
  requireApi()
  const { data } = await apiGet('/vehicle/years')
  return data.items
}

export async function fetchVehicleVariants() {
  requireApi()
  const { data } = await apiGet('/vehicle/variants')
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
