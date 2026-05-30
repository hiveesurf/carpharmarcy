import { deliveryWorkflowTimelineState } from '../../../lib/deliveryUiStage.js'

/**
 * @param {{ order: object, uiStage: string }} props
 */
export function DeliveryWorkflowTimeline({ order, uiStage }) {
  const steps = deliveryWorkflowTimelineState(order, uiStage)

  return (
    <ol className="relative space-y-0" aria-label="Delivery progress">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1
        const isCurrent = step.status === 'current'
        const isDone = step.status === 'done'
        const isFailed = step.status === 'failed'

        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className={`absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 ${
                  isDone ? 'bg-flare/50' : 'bg-[#d5d9d9]'
                }`}
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                isFailed
                  ? 'border-red-500 bg-red-500 text-white'
                  : isCurrent
                    ? 'border-flare bg-flare text-on-accent shadow-[0_0_0_4px_rgba(232,93,44,0.2)]'
                    : isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-[#d5d9d9] bg-white text-[#888c8c]'
              }`}
              aria-hidden
            >
              {isDone || isFailed ? '✓' : idx + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={`text-sm font-semibold ${
                  isCurrent ? 'text-flare' : isDone ? 'text-[#0f1111]' : 'text-[#888c8c]'
                }`}
              >
                {step.label}
              </p>
              {step.at ? (
                <p className="mt-0.5 font-mono text-[10px] text-[#565959]">
                  {new Date(step.at).toLocaleString()}
                </p>
              ) : isCurrent ? (
                <p className="mt-0.5 text-xs font-medium text-flare/90">In progress</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
