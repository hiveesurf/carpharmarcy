import {
  deliveryUiStageBadgeClass,
  deliveryUiStageBadgeLabel,
  deriveDeliveryUiStage,
} from '../../../lib/deliveryUiStage.js'

const BADGE_BASE =
  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset'

/**
 * @param {{ order?: object | null, uiStage?: string, reached?: boolean, className?: string }} props
 */
export function DeliveryStageBadge({ order, uiStage, reached = false, className = '' }) {
  const stage = uiStage || (order ? deriveDeliveryUiStage(order, { reached }) : 'assigned')
  return (
    <span className={`${BADGE_BASE} ${deliveryUiStageBadgeClass(stage)} ${className}`.trim()}>
      {deliveryUiStageBadgeLabel(stage)}
    </span>
  )
}
