import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { useAuth } from '../../context/useAuth.js'
import {
  formatDateTime,
  OrderDetailsMeta,
  OrderLinesTable,
  OrderStatusBadge,
} from '../components/AdminOrderDetailsPanels.jsx'

const canvasClass =
  '-mx-4 min-w-0 rounded-none bg-[#eaeded] px-4 py-5 dark:bg-ink/40 md:-mx-6 md:rounded-xl md:px-6 lg:-mx-0 lg:rounded-xl lg:px-8'

const panel =
  'overflow-hidden rounded-xl border border-[#d5d9d9] bg-white shadow-[0_2px_8px_rgba(15,17,17,0.08)] dark:border-steel/60 dark:bg-slate dark:shadow-none'

const BACK_BTN =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-accent bg-white px-4 py-2 text-sm font-semibold text-accent shadow-sm transition-colors hover:bg-accent-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:bg-slate dark:hover:bg-accent-muted'

export function AdminOrderDetailsPage() {
  const { orderId } = useParams()
  const { sessionRole } = useAuth()
  const isDelivery = sessionRole === 'delivery'
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const o = await adminService.getAdminOrder(orderId)
        if (!cancel) setOrder(o)
      } catch (e) {
        if (!cancel) {
          setError(getFetchErrorMessage(e))
          setOrder(null)
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [orderId])

  useEffect(() => {
    if (isDelivery) return
    let cancel = false
    ;(async () => {
      try {
        const list = await adminService.listEmployees()
        if (!cancel) setEmployees(Array.isArray(list) ? list : [])
      } catch {
        if (!cancel) setEmployees([])
      }
    })()
    return () => {
      cancel = true
    }
  }, [isDelivery])

  const employeeByEmail = useMemo(() => {
    const map = new Map()
    for (const e of employees) {
      const email = String(e?.email ?? '').trim().toLowerCase()
      if (email) map.set(email, e)
    }
    return map
  }, [employees])

  const ordersListPath = '/admin/orders'
  const customerProfilePath =
    order?.userId && !isDelivery
      ? `/admin/users/${encodeURIComponent(String(order.userId))}`
      : null

  return (
    <div className={canvasClass}>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <Link to={ordersListPath} className="font-medium text-accent hover:underline">
              Orders
            </Link>
            {customerProfilePath ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#aab7b8]" aria-hidden />
                <Link to={customerProfilePath} className="font-medium text-accent hover:underline">
                  Customer
                </Link>
              </>
            ) : null}
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#aab7b8]" aria-hidden />
            <span className="truncate font-mono text-xs font-medium text-[#565959] dark:text-mist">
              {orderId}
            </span>
          </nav>
          <div className="flex flex-wrap gap-2">
            {customerProfilePath ? (
              <Link to={customerProfilePath} className={BACK_BTN}>
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Back to customer
              </Link>
            ) : null}
            <Link to={ordersListPath} className={BACK_BTN}>
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Back to orders
            </Link>
          </div>
        </div>

        {error ? (
          <div className={`${panel} px-5 py-8 text-center`}>
            <p className="text-sm text-[#b12704] dark:text-red-300">{error}</p>
            <Link to={ordersListPath} className={`${BACK_BTN} mt-4 inline-flex`}>
              Back to orders
            </Link>
          </div>
        ) : null}

        {loading ? (
          <div className={`${panel} animate-pulse px-5 py-16`} aria-busy="true" />
        ) : null}

        {!loading && !error && order ? (
          <section className={panel}>
            <div className="flex flex-col gap-3 border-b border-[#e3e6e6] bg-[#fafafa] px-4 py-4 dark:border-steel/50 dark:bg-ink/15 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent ring-1 ring-accent/25">
                  <ShoppingBag className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <h1 className="font-mono text-sm font-semibold text-[#0f1111] dark:text-fog">{order.id}</h1>
                  <p className="mt-1 text-xs text-[#565959] dark:text-mist">
                    Placed {formatDateTime(order.createdAt)}
                  </p>
                </div>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <OrderDetailsMeta order={order} isDelivery={isDelivery} employeeByEmail={employeeByEmail} />
            <OrderLinesTable order={order} isDelivery={isDelivery} />
          </section>
        ) : null}

        {!loading && !error && !order ? (
          <div className={`${panel} px-5 py-8 text-center text-sm text-[#565959] dark:text-mist`}>
            Order not found.
          </div>
        ) : null}
      </div>
    </div>
  )
}
