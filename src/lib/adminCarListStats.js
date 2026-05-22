import { carIdentityKey } from './carIdentityNormalize.js'

/**
 * @param {Record<string, unknown>} car
 * @param {string} query
 */
export function matchesAdminCarSearch(car, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    car.make,
    car.model,
    car.variant,
    car.modelYear,
    car.fuel,
    car.transmission,
  ]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ')
  return haystack.includes(q)
}

/**
 * @param {Record<string, unknown>[]} cars
 */
export function computeCarKpis(cars) {
  const active = (cars || []).filter((c) => !c?.deleted && !c?.deletedAt)
  const published = active.filter((c) => Boolean(c.published)).length
  const draft = active.length - published
  const brandKeys = new Set(
    active.map((c) => carIdentityKey(c.make)).filter((k) => k && k.length > 0),
  )
  return {
    total: active.length,
    published,
    draft,
    brands: brandKeys.size,
  }
}
