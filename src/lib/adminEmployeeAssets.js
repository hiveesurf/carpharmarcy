import { resolveApiAssetUrl } from './resolveApiAssetUrl.js'

const PUBLIC_UPLOAD_PREFIX = '/api/v1/public/uploads/vehicles/'

/**
 * @param {Record<string, unknown> | null | undefined} employee
 * @returns {string | null}
 */
function pickEmployeePhotoRaw(employee) {
  if (!employee || typeof employee !== 'object') return null
  const direct = [
    employee.photoUrl,
    employee.photo,
    employee.profilePhotoUrl,
    employee.profilePhoto,
    employee.avatarUrl,
    employee.avatar,
    employee.imageUrl,
    employee.image,
  ]
  for (const v of direct) {
    if (v != null && String(v).trim()) return String(v).trim()
  }
  const md = employee.metadata
  if (md && typeof md === 'object') {
    for (const k of ['photoUrl', 'photo', 'profilePhotoUrl', 'avatarUrl']) {
      const v = md[k]
      if (v != null && String(v).trim()) return String(v).trim()
    }
  }
  return null
}

/**
 * Resolve employee photo for &lt;img src&gt; (API photoUrl, data URLs, public upload paths).
 * @param {Record<string, unknown> | null | undefined} employee
 * @returns {string | null}
 */
export function employeePhotoDisplayUrl(employee) {
  const raw = pickEmployeePhotoRaw(employee)
  if (!raw) return null
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith(PUBLIC_UPLOAD_PREFIX) || raw.startsWith('/api/')) {
    return resolveApiAssetUrl(raw) ?? raw
  }
  const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '')
  const withPrefix = normalized.startsWith('employees/')
    ? `${PUBLIC_UPLOAD_PREFIX}${normalized}`
    : `${PUBLIC_UPLOAD_PREFIX}employees/${normalized}`
  return resolveApiAssetUrl(withPrefix) ?? withPrefix
}

/**
 * @param {Record<string, unknown> | null | undefined} employee
 */
export function employeeInitials(employee) {
  const name = employee?.name ?? employee?.phone ?? 'E'
  const t = String(name).trim()
  if (!t) return 'E'
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
  }
  return t.charAt(0).toUpperCase()
}
