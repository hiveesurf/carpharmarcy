import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { NotificationContext } from './notification-context.js'
import { useAuth } from './useAuth.js'
import * as notificationService from '../services/notificationService.js'
import { requestPushSubscription } from '../lib/pushNotifications.js'
import { subscribeAccessTokenChanged } from '../lib/authTokenEvents.js'

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
    setLoading(true)
    setError(null)
    try {
      const data = isAdminRoute
        ? await notificationService.listAdminNotifications({ limit: 20 })
        : await notificationService.listUserNotifications({ limit: 20 })
      setItems(Array.isArray(data.items) ? data.items : [])
      const rawUnread = data.unreadCount
      const n =
        typeof rawUnread === 'number'
          ? rawUnread
          : typeof rawUnread === 'string'
            ? Number(rawUnread)
            : NaN
      setUnreadCount(Number.isFinite(n) ? n : 0)
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
    return subscribeAccessTokenChanged(() => {
      if (!authHydrated) return
      if (!user && !isAdminRoute) return
      void load()
    })
  }, [authHydrated, isAdminRoute, load, user])

  useEffect(() => {
    const id = window.setInterval(() => {
      void load()
    }, POLL_MS)
    const onFocus = () => void load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
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

  const markReadByIds = useCallback(
    async (ids) => {
      if (!Array.isArray(ids) || ids.length === 0) return
      try {
        if (isAdminRoute) {
          await notificationService.markAdminNotificationsRead({ ids })
        } else {
          await notificationService.markUserNotificationsRead({ ids })
        }
        await load()
      } catch (e) {
        setError(e?.message || 'Could not update notifications')
      }
    },
    [isAdminRoute, load],
  )

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
      markReadByIds,
      subscribePush,
      enablePushNotifications,
      isAdminRoute,
    }),
    [
      items,
      unreadCount,
      loading,
      error,
      panelOpen,
      load,
      markAllRead,
      markReadByIds,
      subscribePush,
      enablePushNotifications,
      isAdminRoute,
    ],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
