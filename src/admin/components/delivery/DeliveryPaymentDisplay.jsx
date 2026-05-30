import { resolveDeliveryPayment } from '../../../lib/deliveryPayment.js'

const BADGE_PAID =
  'inline-flex items-center rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white'

const BADGE_COD =
  'inline-flex items-center rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white'

const BADGE_ONLINE =
  'inline-flex items-center rounded-md bg-[#565959] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white'

/**
 * Payment badge only (list / compact surfaces).
 * @param {{ order: object }} props
 */
export function DeliveryPaymentBadge({ order }) {
  const pay = resolveDeliveryPayment(order)
  if (pay.kind === 'paid') return <span className={BADGE_PAID}>{pay.badgeText}</span>
  if (pay.kind === 'cod') return <span className={BADGE_COD}>{pay.badgeText}</span>
  return <span className={BADGE_ONLINE}>{pay.badgeText}</span>
}

/**
 * @param {{ order: object, layout?: 'inline' | 'stack' | 'compact', showPaymentLabel?: boolean }} props
 */
export function DeliveryPaymentDisplay({ order, layout = 'stack', showPaymentLabel = true }) {
  const pay = resolveDeliveryPayment(order)
  const badge = <DeliveryPaymentBadge order={order} />

  if (layout === 'compact') {
    return (
      <div className="flex flex-col items-end gap-0.5">
        {badge}
        {pay.showAmountToCollect && pay.amountFormatted ? (
          <p className="text-[10px] font-semibold tabular-nums text-[#0f1111]">{pay.amountFormatted}</p>
        ) : null}
      </div>
    )
  }

  if (layout === 'inline') {
    return (
      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {showPaymentLabel ? <span className="text-[#565959]">Payment:</span> : null}
          {badge}
        </div>
        {pay.showAmountToCollect && pay.amountFormatted ? (
          <p className="text-xs text-[#565959]">
            Amount to collect:{' '}
            <span className="text-sm font-bold tabular-nums text-[#0f1111]">{pay.amountFormatted}</span>
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="text-right">
      {showPaymentLabel ? (
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#565959]">Payment</p>
      ) : null}
      <div className={showPaymentLabel ? 'mt-1 flex flex-col items-end gap-1' : 'flex flex-col items-end gap-1'}>
        {badge}
        {pay.showAmountToCollect ? (
          <p className="text-sm font-bold tabular-nums text-[#0f1111]">{pay.amountFormatted ?? '—'}</p>
        ) : null}
      </div>
    </div>
  )
}
