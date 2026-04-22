import { useCallback, useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'

const PAGE_SIZE = 5

export function AdminUsersPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminService.listUsersPage({ page: 0, size: PAGE_SIZE })
      setItems(result.items)
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setItems([])
      setHasMore(false)
      setNextPage(1)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const result = await adminService.listUsersPage({ page: nextPage, size: PAGE_SIZE })
      setItems((prev) => [...prev, ...result.items])
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-fog md:text-3xl">
            Users
          </h1>
          <p className="text-sm text-mist">Accounts and roles.</p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="self-start rounded-xl border border-steel/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">
          {error}
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-mist">Loading users…</p>
      ) : (
        <>
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-steel/50 font-mono text-[10px] uppercase tracking-wider text-mist">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/40">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-mist">
                      No users.
                    </td>
                  </tr>
                )}
                {items.map((u) => (
                  <tr key={u.id} className="text-mist hover:bg-steel/25">
                    <td className="px-5 py-3 font-mono text-xs text-mist">{u.id}</td>
                    <td className="px-5 py-3 font-medium text-fog">{u.name || '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-mist">{u.phone || '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          u.role === 'admin'
                            ? 'inline-flex rounded-full bg-accent-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent ring-1 ring-accent/35'
                            : 'inline-flex rounded-full bg-steel/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist ring-1 ring-steel/60'
                        }
                      >
                        {u.role || 'user'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          {hasMore ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-xl border border-steel/80 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
