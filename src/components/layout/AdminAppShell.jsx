import { Link, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { AuthModals } from '../auth/AuthModals'
import { useAuth } from '../../context/useAuth'
import { useNotifications } from '../../context/useNotifications.js'

/**
 * Admin area only: no storefront navbar/hero/footer — full dashboard after login.
 * Chrome matches storefront navbar (nav-chrome) for a cohesive light-theme look.
 */
export function AdminAppShell({ children }) {
  const navigate = useNavigate()
  const { user, signOut, sessionRole } = useAuth()
  const { unreadCount, panelOpen, setPanelOpen, items, markAllRead, enablePushNotifications } = useNotifications()

  return (
    <div className="relative min-h-svh bg-ink text-fog antialiased">
      <header className="nav-chrome fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-steel/60 bg-ink/95 px-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md md:px-8">
        <Link
          to="/admin"
          className="font-display text-sm font-bold uppercase tracking-wider text-fog transition-colors hover:text-accent"
        >
          carpharmacy admin
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-steel/80 text-mist transition-colors hover:border-accent/40 hover:text-accent"
              aria-label="Admin notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-hud px-1 font-sans text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>
            {panelOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.4rem)] z-[110] w-80 rounded-xl border border-steel/80 bg-ink p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-sans text-xs font-semibold uppercase tracking-wide text-fog">Admin alerts</p>
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="font-sans text-[11px] font-semibold text-accent hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void enablePushNotifications()}
                  className="mb-2 rounded-lg border border-steel/70 px-2 py-1 font-sans text-[11px] text-mist transition-colors hover:border-accent/40 hover:text-accent"
                >
                  Enable push
                </button>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-xs text-mist">No notifications yet.</p>
                  ) : (
                    items.map((n) => (
                      <article key={n.id} className="rounded-lg border border-steel/60 bg-slate/30 p-2.5">
                        <p className="text-xs font-semibold text-fog">{n.title}</p>
                        <p className="mt-1 text-xs text-mist">{n.body}</p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
          {user && (
            <span className="hidden max-w-[240px] truncate font-sans text-xs text-mist md:inline">{user.name} · {sessionRole}</span>
          )}
          <Link
            to="/"
            className="font-sans text-xs font-semibold uppercase tracking-wide text-accent underline-offset-2 hover:underline"
          >
            Store home
          </Link>
          <button
            type="button"
            onClick={() => void signOut().then(() => navigate('/', { replace: true }))}
            className="rounded-xl border border-steel/80 px-3 py-1.5 font-sans text-xs font-semibold text-mist transition-colors hover:border-accent/40 hover:text-accent"
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="pt-14">{children}</div>
      <AuthModals />
    </div>
  )
}
