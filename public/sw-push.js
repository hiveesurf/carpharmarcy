self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }
  const title = payload.title || 'Notification'
  const options = {
    body: payload.body || '',
    data: payload.data || {},
    icon: '/logo-carnalysys.png',
    badge: '/logo-carnalysys.png',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification?.data?.url || '/'
  event.waitUntil(clients.openWindow(target))
})
