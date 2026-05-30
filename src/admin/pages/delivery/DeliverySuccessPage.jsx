import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import * as adminService from '../../../services/adminService.js'
import { useDeliveryOrder } from '../../hooks/useDeliveryOrder.js'
import { deriveDeliveryUiStage, isActiveDeliveryOrder } from '../../../lib/deliveryUiStage.js'
import { resolveDeliveryPayment } from '../../../lib/deliveryPayment.js'
import { DeliveryPageError } from '../../components/delivery/DeliveryPageShell.jsx'
import { DELIVERY_LIST_PATH, deliveryDetailPath } from '../../../lib/deliveryRoutes.js'
import {
  DELIVERY_CANVAS,
  DELIVERY_SUCCESS_BTN,
  DELIVERY_SUCCESS_BTN_OUTLINE,
  DELIVERY_SUCCESS_CARD,
  DELIVERY_SUCCESS_SHELL,
} from '../../components/delivery/deliveryTheme.js'

const CONFETTI = [
  { left: '12%', top: '18%', color: '#22c55e', delay: '0ms', size: 'h-2 w-1' },
  { left: '78%', top: '14%', color: '#f59e0b', delay: '80ms', size: 'h-1.5 w-2' },
  { left: '88%', top: '32%', color: '#3b82f6', delay: '120ms', size: 'h-2 w-2 rounded-full' },
  { left: '6%', top: '36%', color: '#e85d2c', delay: '40ms', size: 'h-1.5 w-2.5' },
  { left: '22%', top: '8%', color: '#a855f7', delay: '160ms', size: 'h-1.5 w-1.5 rounded-full' },
  { left: '68%', top: '6%', color: '#22c55e', delay: '200ms', size: 'h-1.5 w-2' },
  { left: '42%', top: '4%', color: '#f59e0b', delay: '60ms', size: 'h-2 w-1 rounded-full' },
  { left: '54%', top: '22%', color: '#e85d2c', delay: '100ms', size: 'h-1.5 w-1.5' },
]

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function formatPaymentValue(order) {
  const pay = resolveDeliveryPayment(order)
  if (pay.kind === 'cod' && pay.amountFormatted) {
    return `${pay.badgeText} · ${pay.amountFormatted}`
  }
  return pay.badgeText
}

function SuccessConfetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 overflow-hidden" aria-hidden>
      {CONFETTI.map((piece, i) => (
        <span
          key={i}
          className={`absolute ${piece.size} opacity-75 ${i % 2 === 0 ? 'animate-pulse' : 'animate-bounce'}`}
          style={{
            left: piece.left,
            top: piece.top,
            backgroundColor: piece.color,
            animationDuration: i % 2 === 0 ? '2s' : '1.4s',
            animationDelay: piece.delay,
            transform: 'rotate(12deg)',
          }}
        />
      ))}
    </div>
  )
}

/**
 * @param {{ label: string, value: string, mono?: boolean }} props
 */
function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="shrink-0 text-sm text-[#888c8c]">{label}</span>
      <span
        className={`min-w-0 text-right text-sm font-semibold text-[#0f1111] ${mono ? 'break-all font-mono text-xs font-medium' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function SuccessSkeleton() {
  return (
    <div className={DELIVERY_CANVAS}>
      <div className={DELIVERY_SUCCESS_SHELL}>
        <div className={`${DELIVERY_SUCCESS_CARD} animate-pulse`}>
          <div className="mx-auto h-16 w-16 rounded-full bg-[#eaeded]" />
          <div className="mx-auto mt-4 h-6 w-48 rounded bg-[#eaeded]" />
          <div className="mx-auto mt-2 h-4 w-56 rounded bg-[#eaeded]" />
          <div className="mt-6 space-y-3 rounded-xl bg-[#f7fafa] p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 rounded bg-[#eaeded]" />
            ))}
          </div>
          <div className="mx-auto mt-6 h-11 w-full max-w-[360px] rounded-xl bg-[#eaeded]" />
        </div>
      </div>
    </div>
  )
}

export function DeliverySuccessPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { order, loading, error } = useDeliveryOrder(orderId)
  const [nextOrderId, setNextOrderId] = useState(null)

  useEffect(() => {
    if (!order || loading) return
    if (deriveDeliveryUiStage(order) !== 'delivered') {
      navigate(deliveryDetailPath(orderId), { replace: true })
    }
  }, [order, loading, orderId, navigate])

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const list = await adminService.listDeliveryOrders({})
        const active = (Array.isArray(list) ? list : []).filter((o) => isActiveDeliveryOrder(o))
        const other = active.find((o) => o.id !== orderId)
        if (!cancel) setNextOrderId(other?.id ?? null)
      } catch {
        if (!cancel) setNextOrderId(null)
      }
    })()
    return () => {
      cancel = true
    }
  }, [orderId, order?.deliveryDeliveredAt])

  if (loading) return <SuccessSkeleton />
  if (error) return <DeliveryPageError message={error} />
  if (!order) return <DeliveryPageError message="Order not found." />

  const customerName = order.customerName?.trim() || 'Customer'

  return (
    <div className={DELIVERY_CANVAS}>
      <div className={DELIVERY_SUCCESS_SHELL}>
        <article className={DELIVERY_SUCCESS_CARD}>
          <SuccessConfetti />

          <header className="relative text-center">
            <div className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center">
              <span
                className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"
                style={{ animationDuration: '1.8s', animationIterationCount: '2' }}
                aria-hidden
              />
              <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
                <CheckCircle2 className="h-11 w-11 text-emerald-600" strokeWidth={2.25} aria-hidden />
              </div>
            </div>
            <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-[#0f1111] sm:text-2xl">
              Delivered Successfully
            </h1>
            <p className="mt-1 text-sm text-[#565959]">Order completed and verified.</p>
          </header>

          <div className="mt-5 divide-y divide-[#f0f2f2] rounded-xl bg-[#f7fafa] px-3.5 sm:px-4">
            <SummaryRow label="Customer" value={customerName} />
            <SummaryRow label="Order ID" value={order.id} mono />
            <SummaryRow label="Delivered at" value={formatDateTime(order.deliveryDeliveredAt)} />
            <SummaryRow label="Payment" value={formatPaymentValue(order)} />
          </div>

          <div className="mt-6 flex flex-col items-center gap-2.5">
            {nextOrderId ? (
              <Link to={deliveryDetailPath(nextOrderId)} className={DELIVERY_SUCCESS_BTN}>
                Next Order
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            ) : null}
            <Link
              to={DELIVERY_LIST_PATH}
              className={nextOrderId ? DELIVERY_SUCCESS_BTN_OUTLINE : DELIVERY_SUCCESS_BTN}
            >
              Back to Deliveries
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
