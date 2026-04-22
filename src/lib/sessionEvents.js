/** Subscribers run when refresh fails after 401 (session no longer valid). */
const listeners = new Set()

export function subscribeSessionDead(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function notifySessionDead() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}
