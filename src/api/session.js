const SESSION_KEY = 'carnalysys-api-session'

export function getApiSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'anonymous'
  }
}

/** After POST /cart creates a server guest, align header with DB + cookie. */
export function setApiSessionId(id) {
  if (typeof id !== 'string' || !id.trim()) return
  try {
    localStorage.setItem(SESSION_KEY, id.trim())
  } catch {
    /* ignore */
  }
}

/** After login, drop client guest id so the next anonymous session is fresh (server clears cookie). */
export function clearApiSessionId() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}
