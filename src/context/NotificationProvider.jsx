import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { NotificationContext } from './notification-context.js'
import { useAuth } from './useAuth.js'
import * as notificationService from '../services/notificationService.js'
import { requestPushSubscription } from '../lib/pushNotifications.js'

const POLL_MS = 20_000

export function NotificationProvider({ children }) {
  const location = useLocation()
  const { user, authHydrated } = useAuth()
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const isAdminRoute = location.pathname.startsWith('/admin')

  const load = useCallback(async () => {
    if (!authHydrated) return
    if (!user && !isAdminRoute) return
    if (document.visibilityState === 'hidden') return
    setLoading(true)
    setError(null)
    try {
      const data = isAdminRoute
        ? await notificationService.listAdminNotifications({ limit: 20 })
        : await notificationService.listUserNotifications({ limit: 20 })
      setItems(Array.isArray(data.items) ? data.items : [])
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0)
    } catch (e) {
      setError(e?.message || 'Could not load notifications')
    } finally {
      setLoading(false)
    }
  }, [authHydrated, isAdminRoute, user])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => {
      void load()
    }, POLL_MS)
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  const markAllRead = useCallback(async () => {
    try {
      if (isAdminRoute) {
        await notificationService.markAdminNotificationsRead({ all: true })
      } else {
        await notificationService.markUserNotificationsRead({ all: true })
      }
      await load()
    } catch (e) {
      setError(e?.message || 'Could not mark notifications as read')
    }
  }, [isAdminRoute, load])

  const subscribePush = useCallback(async (subscription) => {
    if (!subscription) return
    if (isAdminRoute) {
      await notificationService.subscribeAdminPush(subscription)
    } else {
      await notificationService.subscribeUserPush(subscription)
    }
  }, [isAdminRoute])

  const enablePushNotifications = useCallback(async () => {
    const subscription = await requestPushSubscription()
    await subscribePush(subscription)
    return true
  }, [subscribePush])

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      error,
      panelOpen,
      setPanelOpen,
      refreshNotifications: load,
      markAllRead,
      subscribePush,
      enablePushNotifications,
      isAdminRoute,
    }),
    [items, unreadCount, loading, error, panelOpen, load, markAllRead, subscribePush, enablePushNotifications, isAdminRoute],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
