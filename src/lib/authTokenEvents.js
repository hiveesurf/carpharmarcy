const listeners = new Set()

export function subscribeAccessTokenChanged(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function notifyAccessTokenChanged() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}
