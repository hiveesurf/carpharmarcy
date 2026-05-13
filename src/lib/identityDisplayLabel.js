/**
 * Public UI identity strings (headers, nav): phone-based, no full phone, no email.
 * @typedef {{ phone?: string, phoneE164?: string, phone_e164?: string, secondaryPhone?: string, role?: string }} IdentityUserLike
 */

/**
 * @param {string | undefined | null} raw
 * @returns {string} Last 4 digits when at least 4 digit chars exist; otherwise empty.
 */
export function phoneDigitsLast4(raw) {
  if (raw == null) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length < 4) return ''
  return digits.slice(-4)
}

/**
 * @param {IdentityUserLike | null | undefined} user
 * @param {string | undefined | null} sessionRole
 * @returns {string}
 */
export function formatPublicIdentityLabel(user, sessionRole) {
  const role = String(sessionRole || user?.role || 'user')
    .trim()
    .toLowerCase()
  if (role === 'super_admin' || role === 'admin') {
    return 'super_admin'
  }
  const last4 = phoneDigitsLast4(
    user?.phone ?? user?.phoneE164 ?? user?.phone_e164 ?? user?.secondaryPhone,
  )
  if (role === 'sales') {
    return last4 ? `User ${last4} · sales` : 'User · sales'
  }
  if (role === 'delivery') {
    return last4 ? `User ${last4} · delivery` : 'User · delivery'
  }
  return last4 ? `User ${last4}` : 'User'
}

/**
 * Two-character (or one) avatar initials from phone + role — avoids name/email in chrome.
 * @param {IdentityUserLike | null | undefined} user
 * @param {string | undefined | null} sessionRole
 * @returns {string}
 */
export function formatPublicIdentityInitials(user, sessionRole) {
  const role = String(sessionRole || user?.role || 'user')
    .trim()
    .toLowerCase()
  if (role === 'super_admin' || role === 'admin') {
    return 'SA'
  }
  const last4 = phoneDigitsLast4(
    user?.phone ?? user?.phoneE164 ?? user?.phone_e164 ?? user?.secondaryPhone,
  )
  if (last4.length >= 2) {
    return last4.slice(-2).toUpperCase()
  }
  if (role === 'sales') return 'S'
  if (role === 'delivery') return 'D'
  return 'U'
}
