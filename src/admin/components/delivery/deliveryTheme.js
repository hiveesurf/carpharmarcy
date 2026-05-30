/** Shared Carpharmarcy delivery UI tokens (admin #eaeded canvas + orange CTAs). */

export const DELIVERY_CANVAS =
  '-mx-4 min-h-0 bg-[#eaeded] px-3 pb-24 pt-4 md:-mx-6 md:px-4 md:pb-20 md:pt-5 lg:-mx-0 lg:px-0 lg:pt-5'

/** My Deliveries list — align with admin orders width. */
export const DELIVERY_SHELL_LIST = 'mx-auto flex w-full max-w-3xl flex-col gap-2 lg:max-w-4xl'

export const DELIVERY_SHELL = DELIVERY_SHELL_LIST

/** Centered workflow panel (~960px). */
export const DELIVERY_SHELL_CENTERED = 'mx-auto w-full max-w-[960px] pb-4'

/** Single white workflow container. */
export const DELIVERY_PANEL =
  'overflow-hidden rounded-2xl border border-[#d5d9d9] bg-white shadow-[0_4px_24px_rgba(15,17,17,0.08)]'

export const DELIVERY_PANEL_INNER = 'space-y-3 p-3.5 sm:p-4'

export const DELIVERY_SECTION =
  'rounded-xl border border-[#e7e7e7] bg-[#fafafa]/80 px-3 py-2.5 sm:px-3.5 sm:py-3'

export const DELIVERY_CARD =
  'overflow-hidden rounded-xl border border-[#d5d9d9] bg-white shadow-[0_2px_8px_rgba(15,17,17,0.08)]'

export const DELIVERY_CARD_PAD = 'p-3 sm:p-4'

export const DELIVERY_CARD_COMPACT = 'px-3 py-2.5 sm:px-3.5 sm:py-3'

export const DELIVERY_PRIMARY_BTN =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-flare px-4 text-sm font-semibold text-on-accent shadow-[0_2px_6px_rgba(232,93,44,0.35)] transition hover:brightness-[1.03] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[46px]'

/** Side-by-side bottom actions on desktop (not full viewport width). */
export const DELIVERY_PRIMARY_BTN_INLINE =
  'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-flare px-4 text-sm font-semibold text-on-accent shadow-[0_2px_6px_rgba(232,93,44,0.35)] transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-50'

export const DELIVERY_OUTLINE_DANGER_BTN =
  'inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50'

export const DELIVERY_SECONDARY_BTN =
  'flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#d5d9d9] bg-white px-2 py-2 text-xs font-semibold text-[#0f1111] shadow-[0_1px_2px_rgba(15,17,17,0.08)] transition hover:bg-[#f7fafa] active:bg-[#eaeded] sm:min-h-[42px] sm:gap-2 sm:px-3 sm:text-sm'

export const DELIVERY_GHOST_BTN =
  'inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-red-200 bg-white text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50'

export const DELIVERY_LINK =
  'inline-flex items-center gap-1.5 text-sm font-semibold text-flare hover:text-[#d14d26] hover:underline'

export const DELIVERY_LABEL =
  'font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#565959]'

export const DELIVERY_FILTER_TAB =
  'inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold transition'

export const DELIVERY_FILTER_SELECT =
  'h-9 shrink-0 rounded-lg border border-[#d5d9d9] bg-white px-2.5 text-sm text-[#0f1111] outline-none focus:border-flare focus:ring-2 focus:ring-flare/20'

export const DELIVERY_INPUT_FOCUS =
  'outline-none focus:border-flare focus:ring-2 focus:ring-flare/25'

/** Delivery completion screen — compact centered card (~520–640px). */
export const DELIVERY_SUCCESS_SHELL =
  'mx-auto flex w-full max-w-[520px] flex-col items-center px-1 py-5 sm:max-w-[600px] sm:py-8'

export const DELIVERY_SUCCESS_CARD =
  'relative w-full overflow-hidden rounded-2xl bg-white px-5 py-6 shadow-[0_8px_32px_rgba(15,17,17,0.1)] sm:px-6 sm:py-7'

export const DELIVERY_SUCCESS_BTN =
  'inline-flex h-11 w-full max-w-[360px] items-center justify-center gap-1.5 rounded-xl bg-flare px-4 text-sm font-bold text-on-accent shadow-[0_2px_10px_rgba(232,93,44,0.35)] transition hover:brightness-[1.03] active:scale-[0.99] sm:h-12'

export const DELIVERY_SUCCESS_BTN_OUTLINE =
  'inline-flex h-11 w-full max-w-[360px] items-center justify-center rounded-xl border border-[#d5d9d9] bg-white px-4 text-sm font-semibold text-[#0f1111] shadow-[0_1px_4px_rgba(15,17,17,0.06)] transition hover:bg-[#f7fafa] active:bg-[#eaeded] sm:h-12'

/** @deprecated use DELIVERY_SHELL_CENTERED */
export const DELIVERY_SHELL_WIDE = DELIVERY_SHELL_CENTERED
