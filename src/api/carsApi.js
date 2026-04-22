import { apiPost } from './client.js'

/** Compatibility endpoint for vehicle enquiry (not part of core 35-route contract). */
export function submitCarEnquiry(carId, body = {}) {
  return apiPost(`/compat/vehicle-enquiry/${encodeURIComponent(carId)}`, body, { skipAuth: true })
}
