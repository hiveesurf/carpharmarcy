import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

function Checking() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center pt-8 font-mono text-xs uppercase tracking-wider text-mist">
      Checking session…
    </div>
  )
}

export function AdminRoute({ children }) {
  const { isAdmin, authHydrated } = useAuth()

  if (!authHydrated) {
    return <Checking />
  }

  if (isAdmin) {
    return children
  }

  return <Navigate to="/" replace />
}
