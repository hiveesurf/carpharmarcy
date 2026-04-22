/** Set when user leaves Home so the next visit can open on the final hero frame */
export const HERO_AT_END_SESSION_KEY = 'carnalysys-hero-at-end'

export function markHeroUserLeftHome() {
  try {
    sessionStorage.setItem(HERO_AT_END_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

function navigationWasReload() {
  try {
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav && nav.type === 'reload') return true
  } catch {
    /* ignore */
  }
  try {
    // Legacy (deprecated but still present in some WebViews)
    if (typeof performance.navigation !== 'undefined' && performance.navigation.type === 1) {
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

/**
 * Call once when Hero mounts (useState initializer).
 * Full page reload clears the flag so the scrub animation runs from frame 1 again.
 */
export function readHeroResumeAtEndOnMount() {
  if (navigationWasReload()) {
    try {
      sessionStorage.removeItem(HERO_AT_END_SESSION_KEY)
    } catch {
      /* ignore */
    }
    return false
  }
  try {
    return sessionStorage.getItem(HERO_AT_END_SESSION_KEY) === '1'
  } catch {
    return false
  }
}
