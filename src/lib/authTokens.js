import { notifyAccessTokenChanged } from './authTokenEvents.js'

/** Short-lived access token — memory only (never localStorage). */
let accessToken = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token || null
  notifyAccessTokenChanged()
}

export function clearAccessToken() {
  accessToken = null
  notifyAccessTokenChanged()
}
