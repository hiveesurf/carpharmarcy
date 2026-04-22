import { apiV1Base } from '../api/client.js'
import * as carsApi from '../api/carsApi.js'

export async function submitVehicleEnquiry(carId, body = {}) {
  if (!apiV1Base()) {
    throw new Error('API not configured (set VITE_API_BASE or run Vite dev with Spring on :8080).')
  }
  const { data } = await carsApi.submitCarEnquiry(carId, body)
  return data
}
