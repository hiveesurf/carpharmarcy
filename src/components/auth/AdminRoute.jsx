import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { apiV1Base } from '../../api/client.js'

function Checking() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center pt-8 font-mono text-xs uppercase tracking-wider text-mist">
      Checking session…
    </div>
  )
}

/**
 * Allows access if phone JWT says admin, or if an admin cookie session is valid (email login) without JWT.
 */
export function AdminRoute({ children }) {
  const { isAdmin, authHydrated } = useAuth()
  const [adminCookieOk, setAdminCookieOk] = useState(null)

  useEffect(() => {
    if (!authHydrated || isAdmin) {
      setAdminCookieOk(null)
      return
    }
    const base = apiV1Base()
    if (!base) {
      setAdminCookieOk(false)
      return
    }
    let cancelled = false
    fetch(`${base}/admin/dashboard`, { credentials: 'include' })
      .then((res) => {
        if (!cancelled) setAdminCookieOk(res.ok)
      })
      .catch(() => {
        if (!cancelled) setAdminCookieOk(false)
      })
    return () => {
      cancelled = true
    }
  }, [authHydrated, isAdmin])

  if (!authHydrated) {
    return <Checking />
  }

  if (isAdmin) {
    return children
  }

  const base = apiV1Base()
  if (base && adminCookieOk === null) {
    return <Checking />
  }

  if (adminCookieOk === true) {
    return children
  }

  return <Navigate to="/" replace />
}
