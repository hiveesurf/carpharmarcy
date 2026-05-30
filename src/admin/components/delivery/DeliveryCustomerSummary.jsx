import { MapPin } from 'lucide-react'
import { formatDeliveryAddress } from '../../../lib/deliveryUiStage.js'
import { customerInitials } from '../../../lib/deliveryPayment.js'
import { DeliveryPaymentDisplay } from './DeliveryPaymentDisplay.jsx'

/**
 * @param {{ order: object, customerName: string }} props
 */
export function DeliveryCustomerSummary({ order, customerName }) {
  const address = formatDeliveryAddress(order?.shippingAddress)
  const phone = order?.customerPhone

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-flare-muted font-display text-sm font-bold text-flare ring-1 ring-flare/25"
          aria-hidden
        >
          {customerInitials(customerName)}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#0f1111]">{customerName}</p>
          {phone ? <p className="mt-0.5 font-mono text-sm text-[#565959]">{phone}</p> : null}
          <p className="mt-1.5 flex gap-1.5 text-sm leading-snug text-[#565959]">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-flare" aria-hidden />
            {address}
          </p>
        </div>
      </div>
      <DeliveryPaymentDisplay order={order} layout="stack" />
    </div>
  )
}
