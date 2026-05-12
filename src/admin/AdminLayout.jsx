import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  Users,
  UserCog,
  CarFront,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'

function navByRole(role) {
  const base = [
    {
      to: '/admin',
      end: true,
      label: role === 'delivery' ? 'Dashboard' : 'Analytics',
      icon: LayoutDashboard,
    },
  ]
  if (role === 'super_admin' || role === 'sales') {
    base.push({ to: '/admin/products', label: 'Products', icon: Package })
  }
  if (role === 'super_admin') {
    base.push({ to: '/admin/cars', label: 'Cars', icon: CarFront })
    base.push({ to: '/admin/categories', label: 'Categories', icon: FolderTree })
    base.push({ to: '/admin/users', label: 'Users', icon: Users })
    base.push({ to: '/admin/employees', label: 'Employees', icon: UserCog })
  }
  base.push({ to: '/admin/orders', label: role === 'delivery' ? 'My deliveries' : 'Orders', icon: ShoppingBag })
  return base
}

function NavItems({ onNavigate, role }) {
  const nav = navByRole(role)
  return (
    <nav className="flex flex-col gap-1 p-2">
      {nav.map(({ to, end, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-xs font-semibold uppercase tracking-wide transition-colors',
              isActive
                ? 'bg-accent-muted text-accent ring-1 ring-accent/35'
                : 'text-mist hover:bg-steel/40 hover:text-fog',
            ].join(' ')
          }
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { sessionRole } = useAuth()
  const role = ['super_admin', 'sales', 'delivery'].includes(sessionRole) ? sessionRole : 'super_admin'

  return (
    <div className="pb-16 pt-4 text-fog md:pt-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:gap-8 md:px-6 lg:px-10">
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="admin-card flex w-full items-center justify-between px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-fog"
          >
            Admin menu
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {mobileOpen && (
            <div className="admin-card mt-2 p-2">
              <NavItems role={role} onNavigate={() => setMobileOpen(false)} />
            </div>
          )}
        </div>

        <aside className="hidden w-52 shrink-0 md:block lg:w-56">
          <div className="admin-card sticky top-20 p-3">
            <p className="px-2 pb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-mist">
              Admin
            </p>
            <NavItems role={role} />
            <Link
              to="/"
              className="mt-3 block px-3 py-2 font-sans text-xs font-medium text-accent underline-offset-2 hover:underline"
            >
              ← Store home
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
