import { apiGet, apiPost } from './client.js'

export function userNotifications({ cursor, limit = 20, unreadOnly = false } = {}) {
  const q = new URLSearchParams()
  if (cursor) q.set('cursor', cursor)
  q.set('limit', String(limit))
  q.set('unreadOnly', String(Boolean(unreadOnly)))
  return apiGet(`/auth/notifications?${q.toString()}`)
}

export function userMarkNotificationsRead({ ids = [], all = false } = {}) {
  return apiPost('/auth/notifications/read', { ids, all })
}

export function userSubscribePush(subscription) {
  return apiPost('/auth/notifications/push/subscribe', subscription)
}

export function userUnsubscribePush(endpoint) {
  return apiPost('/auth/notifications/push/unsubscribe', { endpoint })
}

export function adminNotifications({ cursor, limit = 20, unreadOnly = false } = {}) {
  const q = new URLSearchParams()
  if (cursor) q.set('cursor', cursor)
  q.set('limit', String(limit))
  q.set('unreadOnly', String(Boolean(unreadOnly)))
  return apiGet(`/admin/notifications?${q.toString()}`)
}

export function adminMarkNotificationsRead({ ids = [], all = false } = {}) {
  return apiPost('/admin/notifications/read', { ids, all })
}

export function adminSubscribePush(subscription) {
  return apiPost('/admin/notifications/push/subscribe', subscription)
}

export function adminUnsubscribePush(endpoint) {
  return apiPost('/admin/notifications/push/unsubscribe', { endpoint })
}
