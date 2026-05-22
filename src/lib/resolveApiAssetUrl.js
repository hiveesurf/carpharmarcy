import { apiV1Base } from '../api/client.js'

/**
 * Avatar and other API-served static paths come from the backend as `/api/v1/...`.
 * In dev, same-origin + Vite proxy works. In production with a separate API host
 * (`VITE_API_BASE`), `<img src="/api/...">` would hit the static site and 404 — prefix the API origin.
 *
 * @param {string | undefined | null} path
 * @returns {string | undefined}
 */
export function resolveApiAssetUrl(path) {
  if (path == null || typeof path !== 'string' || !path.trim()) return undefined
  const p = path.trim()
  if (p.startsWith('data:') || p.startsWith('blob:')) return p
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  const base = apiV1Base()
  if (!base) return p
  if (base.startsWith('http://') || base.startsWith('https://')) {
    try {
      const origin = new URL(base).origin
      return new URL(p.startsWith('/') ? p : `/${p}`, origin).href
    } catch {
      return p
    }
  }
  return p
}
