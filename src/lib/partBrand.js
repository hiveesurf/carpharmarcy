/**
 * OEM/OES part brand — same normalization as storefront catalog filters.
 */

export function normalizePartBrand(value) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

/** @param {{ brand?: string, supplierName?: string }} part */
export function partPublicBrand(part) {
  const b = part?.brand != null ? String(part.brand).trim() : ''
  if (b) return b
  const s = part?.supplierName != null ? String(part.supplierName).trim() : ''
  return s || ''
}

/** @param {{ brand?: string, supplierName?: string }} part */
export function partMatchesBrand(part, brandFilter) {
  const key = normalizePartBrand(brandFilter)
  if (!key) return true
  return normalizePartBrand(partPublicBrand(part)) === key
}

/** Build /catalog query for home section links. */
export function catalogHref({ category, partBrand, q, brandId, carId, year, fuel } = {}) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (partBrand) params.set('brand', partBrand)
  if (q) params.set('q', q)
  if (brandId) params.set('brandId', brandId)
  if (carId) params.set('carId', carId)
  if (year) params.set('year', year)
  if (fuel) params.set('fuel', fuel)
  const qs = params.toString()
  return qs ? `/catalog?${qs}` : '/catalog'
}
