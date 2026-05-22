import { resolveApiAssetUrl } from './resolveApiAssetUrl.js'

/**
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
function resolveCarAssetUrl(raw) {
  if (raw == null || !String(raw).trim()) return null
  const s = String(raw).trim()
  if (s.startsWith('data:') || s.startsWith('blob:')) return s
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  return resolveApiAssetUrl(s) ?? s
}

/**
 * Car listing photo from API `image` field.
 * @param {Record<string, unknown> | null | undefined} car
 */
export function carListImageUrl(car) {
  return resolveCarAssetUrl(car?.image)
}

/**
 * Brand logo from API `brandLogo` field.
 * @param {Record<string, unknown> | null | undefined} car
 */
export function carBrandLogoUrl(car) {
  return resolveCarAssetUrl(car?.brandLogo)
}
