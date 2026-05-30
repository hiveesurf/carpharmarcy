import { Navigation, Phone, MessageCircle } from 'lucide-react'
import { DELIVERY_SECONDARY_BTN } from './deliveryTheme.js'

/**
 * @param {{ tel: string | null, wa: string | null, maps: string | null, labels?: 'short' | 'full' }} props
 */
export function DeliveryContactActions({ tel, wa, maps, labels = 'full' }) {
  const callLabel = labels === 'full' ? 'Call Customer' : 'Call'
  const waLabel = labels === 'full' ? 'WhatsApp' : 'WA'
  const navLabel = labels === 'full' ? 'Navigate' : 'Nav'

  return (
    <div className="grid grid-cols-3 gap-2">
      {tel ? (
        <a href={tel} className={DELIVERY_SECONDARY_BTN}>
          <Phone className="h-4 w-4 shrink-0 text-flare" aria-hidden />
          <span className="truncate">{callLabel}</span>
        </a>
      ) : (
        <span className={`${DELIVERY_SECONDARY_BTN} pointer-events-none opacity-40`}>
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{callLabel}</span>
        </span>
      )}
      {wa ? (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={DELIVERY_SECONDARY_BTN}>
          <MessageCircle className="h-4 w-4 shrink-0 text-flare" aria-hidden />
          <span className="truncate">{waLabel}</span>
        </a>
      ) : (
        <span className={`${DELIVERY_SECONDARY_BTN} pointer-events-none opacity-40`}>
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{waLabel}</span>
        </span>
      )}
      {maps ? (
        <a href={maps} target="_blank" rel="noopener noreferrer" className={DELIVERY_SECONDARY_BTN}>
          <Navigation className="h-4 w-4 shrink-0 text-flare" aria-hidden />
          <span className="truncate">{navLabel}</span>
        </a>
      ) : (
        <span className={`${DELIVERY_SECONDARY_BTN} pointer-events-none opacity-40`}>
          <Navigation className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{navLabel}</span>
        </span>
      )}
    </div>
  )
}
