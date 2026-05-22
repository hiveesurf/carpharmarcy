import { normalizeCarBrand, normalizeCarText } from './carIdentityNormalize.js'

export { normalizeCarText } from './carIdentityNormalize.js'

/**
 * @param {string|number|null|undefined} raw
 * @returns {{ error: string } | { value: number }}
 */
export function parsePositiveCarYear(raw) {
  const yearStr = raw === null || raw === undefined ? '' : String(raw).trim()
  if (!yearStr) {
    return { error: 'Year is required' }
  }
  if (!/^-?\d+$/.test(yearStr)) {
    return { error: 'Year must be a whole number' }
  }
  const y = Number(yearStr)
  if (!Number.isSafeInteger(y) || y <= 0) {
    return { error: 'Year must be greater than 0' }
  }
  return { value: y }
}

/**
 * @param {{ make?: string, model?: string, modelYear?: string|number, variant?: string, fuel?: string, transmission?: string }} fields
 * @param {{ fuelLabels?: string[], transmissionLabels?: string[] } | undefined} catalog When provided and non-empty, fuel/transmission must match these API-driven lists (legacy edit values may be included in the arrays by the caller).
 * @returns {{ errors: Record<string, string>, values: { make: string, model: string, modelYear: number, variant: string, fuel: string } | null }}
 */
export function validateCarForm(fields, catalog) {
  const errors = {}
  const make = normalizeCarBrand(fields.make)
  const model = normalizeCarText(fields.model)
  const variant = normalizeCarText(fields.variant)
  const fuel = normalizeCarText(fields.fuel)
  const transmission = normalizeCarText(fields.transmission)

  if (!make) errors.make = 'Brand is required'
  if (!model) errors.model = 'Model is required'
  if (!variant) errors.variant = 'Variant is required'
  if (!fuel) errors.fuel = 'Fuel is required'

  const fuelLabels = catalog?.fuelLabels
  if (Array.isArray(fuelLabels) && fuelLabels.length > 0 && fuel) {
    if (!fuelLabels.includes(fuel)) {
      errors.fuel = 'Select a valid fuel from the list'
    }
  }

  const transmissionLabels = catalog?.transmissionLabels
  if (Array.isArray(transmissionLabels) && transmissionLabels.length > 0 && transmission) {
    if (!transmissionLabels.includes(transmission)) {
      errors.transmission = 'Select a valid transmission from the list'
    }
  }

  const yearResult = parsePositiveCarYear(fields.modelYear)
  let modelYear = null
  if ('error' in yearResult) {
    errors.modelYear = yearResult.error
  } else {
    modelYear = yearResult.value
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values: null }
  }

  return {
    errors,
    values: { make, model, modelYear, variant, fuel },
  }
}
