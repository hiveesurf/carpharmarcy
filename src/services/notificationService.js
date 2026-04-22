import * as notificationApi from '../api/notificationApi.js'
import { apiV1Base } from '../api/client.js'

export async function listUserNotifications(params = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await notificationApi.userNotifications(params)
  return data ?? { items: [], unreadCount: 0 }
}

export async function markUserNotificationsRead({ ids = [], all = false } = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await notificationApi.userMarkNotificationsRead({ ids, all })
  return data ?? { updated: 0 }
}

export async function listAdminNotifications(params = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await notificationApi.adminNotifications(params)
  return data ?? { items: [], unreadCount: 0 }
}

export async function markAdminNotificationsRead({ ids = [], all = false } = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await notificationApi.adminMarkNotificationsRead({ ids, all })
  return data ?? { updated: 0 }
}

export async function subscribeUserPush(subscription) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  return notificationApi.userSubscribePush(subscription)
}

export async function subscribeAdminPush(subscription) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  return notificationApi.adminSubscribePush(subscription)
}
