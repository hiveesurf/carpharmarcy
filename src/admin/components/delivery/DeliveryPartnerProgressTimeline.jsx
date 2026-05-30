import { deliveryPartnerProgressSteps } from '../../../lib/deliveryUiStage.js'

/**
 * Horizontal compact stepper (desktop) + vertical fallback (mobile).
 * @param {{ order: object, uiStage: string }} props
 */
export function DeliveryPartnerProgressTimeline({ order, uiStage }) {
  const steps = deliveryPartnerProgressSteps(order, uiStage)

  return (
    <>
      <ol className="hidden items-start md:flex" aria-label="Delivery progress">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          const isCurrent = step.status === 'current'
          const isDone = step.status === 'done'
          const isFailed = step.status === 'failed'

          return (
            <li key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center">
              {!isLast ? (
                <span
                  className={`absolute left-[calc(50%+10px)] top-[9px] h-px w-[calc(100%-20px)] ${
                    isDone ? 'bg-emerald-400' : 'bg-[#d5d9d9]'
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[9px] font-bold ${
                  isFailed
                    ? 'border-red-500 bg-red-500 text-white'
                    : isCurrent
                      ? 'border-flare bg-flare text-on-accent'
                      : isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[#d5d9d9] bg-white text-[#888c8c]'
                }`}
              >
                {isDone || isFailed ? '✓' : idx + 1}
              </span>
              <p
                className={`mt-1 max-w-[5.5rem] text-center text-[10px] font-semibold leading-tight ${
                  isCurrent ? 'text-flare' : isDone ? 'text-[#0f1111]' : 'text-[#888c8c]'
                }`}
              >
                {step.shortLabel ?? step.label}
              </p>
            </li>
          )
        })}
      </ol>

      <ol className="relative space-y-0 md:hidden" aria-label="Delivery progress">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          const isCurrent = step.status === 'current'
          const isDone = step.status === 'done'
          const isFailed = step.status === 'failed'

          return (
            <li key={`m-${step.key}`} className="relative flex gap-2 pb-1.5 last:pb-0">
              {!isLast ? (
                <span
                  className={`absolute left-[9px] top-[18px] h-[calc(100%-10px)] w-px ${
                    isDone ? 'bg-flare/50' : 'bg-[#d5d9d9]'
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${
                  isFailed
                    ? 'border-red-500 bg-red-500 text-white'
                    : isCurrent
                      ? 'border-flare bg-flare text-on-accent'
                      : isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[#d5d9d9] bg-white text-[#888c8c]'
                }`}
              >
                {isDone || isFailed ? '✓' : idx + 1}
              </span>
              <p
                className={`pt-0.5 text-xs font-semibold ${
                  isCurrent ? 'text-flare' : isDone ? 'text-[#0f1111]' : 'text-[#888c8c]'
                }`}
              >
                {step.label}
              </p>
            </li>
          )
        })}
      </ol>
    </>
  )
}
