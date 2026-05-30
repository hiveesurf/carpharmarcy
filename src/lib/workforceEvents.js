/** Bump key for cross-tab workforce availability refresh (Admin Employees, etc.). */
export const WORKFORCE_AVAILABILITY_BUMP_KEY = 'carnalysys:workforce-availability-bump'

export const WORKFORCE_AVAILABILITY_CHANGED_EVENT = 'carnalysys:workforce-availability-changed'

/** Call after delivery/super-admin availability changes or delivery logout/login. */
export function notifyWorkforceAvailabilityChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(WORKFORCE_AVAILABILITY_CHANGED_EVENT))
  try {
    localStorage.setItem(WORKFORCE_AVAILABILITY_BUMP_KEY, String(Date.now()))
  } catch {
    /* private mode */
  }
}

/**
 * @param {() => void} onRefresh
 */
export function subscribeWorkforceAvailabilityRefresh(onRefresh) {
  if (typeof window === 'undefined') return () => {}

  const refresh = () => onRefresh()

  window.addEventListener(WORKFORCE_AVAILABILITY_CHANGED_EVENT, refresh)
  const onStorage = (e) => {
    if (e.key === WORKFORCE_AVAILABILITY_BUMP_KEY) refresh()
  }
  window.addEventListener('storage', onStorage)
  const onVisibility = () => {
    if (document.visibilityState === 'visible') refresh()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    window.removeEventListener(WORKFORCE_AVAILABILITY_CHANGED_EVENT, refresh)
    window.removeEventListener('storage', onStorage)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
