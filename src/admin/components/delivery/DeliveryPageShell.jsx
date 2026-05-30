import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DELIVERY_LIST_PATH } from '../../../lib/deliveryRoutes.js'
import {
  DELIVERY_CANVAS,
  DELIVERY_CARD,
  DELIVERY_CARD_COMPACT,
  DELIVERY_CARD_PAD,
  DELIVERY_LINK,
  DELIVERY_PANEL,
  DELIVERY_PANEL_INNER,
  DELIVERY_SHELL_CENTERED,
  DELIVERY_SHELL_LIST,
} from './deliveryTheme.js'

export function DeliveryPageLoading() {
  return (
    <div className={DELIVERY_CANVAS}>
      <div className={`${DELIVERY_SHELL_CENTERED} animate-pulse`}>
        <div className={`${DELIVERY_PANEL} h-[420px]`} />
      </div>
    </div>
  )
}

/**
 * @param {{ message: string, backTo?: string, backLabel?: string }} props
 */
export function DeliveryPageError({ message, backTo = DELIVERY_LIST_PATH, backLabel = 'Back to deliveries' }) {
  return (
    <div className={DELIVERY_CANVAS}>
      <div className={`${DELIVERY_SHELL_CENTERED} pt-2 text-center`}>
        <div className={`${DELIVERY_PANEL} ${DELIVERY_PANEL_INNER}`}>
          <p className="text-sm text-red-700">{message}</p>
          <Link to={backTo} className={`${DELIVERY_LINK} mt-3 inline-flex`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * @param {{ children: import('react').ReactNode, className?: string, centered?: boolean, list?: boolean }} props
 */
export function DeliveryPageShell({ children, className = '', centered = true, list = false }) {
  const shell = list ? DELIVERY_SHELL_LIST : DELIVERY_SHELL_CENTERED
  if (!centered || list) {
    return (
      <div className={DELIVERY_CANVAS}>
        <div className={`${shell} ${className}`.trim()}>{children}</div>
      </div>
    )
  }
  return (
    <div className={DELIVERY_CANVAS}>
      <div className={`${DELIVERY_SHELL_CENTERED} ${className}`.trim()}>
        <div className={DELIVERY_PANEL}>
          <div className={DELIVERY_PANEL_INNER}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * @param {{ children: import('react').ReactNode, className?: string, compact?: boolean }} props
 */
export function DeliveryPageCard({ children, className = '', compact = false }) {
  const pad = compact ? DELIVERY_CARD_COMPACT : DELIVERY_CARD_PAD
  return <section className={`${DELIVERY_CARD} ${pad} ${className}`.trim()}>{children}</section>
}

/**
 * Subsection inside centered panel.
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function DeliveryPanelSection({ children, className = '' }) {
  return <section className={`rounded-xl border border-[#e7e7e7] bg-[#fafafa]/60 px-3 py-2.5 sm:px-3.5 ${className}`.trim()}>{children}</section>
}
