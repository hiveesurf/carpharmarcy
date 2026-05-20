export function ProfileSummaryCard({
  label,
  value,
  active,
  onClick,
  className = '',
  variant = 'default',
  icon: Icon,
}) {
  if (variant === 'seller') {
    const base =
      'group relative flex w-full flex-col rounded-lg border bg-white px-3 py-3 text-left shadow-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007185]/40 focus-visible:ring-offset-2 dark:bg-slate dark:shadow-none'
    const state = active
      ? 'border-2 border-[#007185] bg-[#e7f4f5] shadow-md dark:border-[#48a6b8] dark:bg-[#1a3a42]'
      : 'border-[#d5d9d9] hover:border-[#007185]/50 hover:shadow-md dark:border-steel/60 dark:hover:border-[#48a6b8]/50'

    return (
      <button type="button" onClick={onClick} className={`${base} ${state} ${className}`.trim()}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6f7373] dark:text-mist">
            {label}
          </p>
          {Icon ? (
            <Icon
              className={`h-4 w-4 shrink-0 ${active ? 'text-[#007185] dark:text-[#48a6b8]' : 'text-[#aab7b8] dark:text-mist'}`}
              strokeWidth={2}
              aria-hidden
            />
          ) : null}
        </div>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums leading-none text-[#0f1111] dark:text-fog sm:text-[1.65rem]">
          {value ?? 0}
        </p>
      </button>
    )
  }

  const base =
    'group relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
  const state = active
    ? 'border-accent/50 bg-gradient-to-br from-accent-muted/80 via-ink/40 to-ink/20 shadow-[0_0_24px_-8px] shadow-accent/25 ring-1 ring-accent/30'
    : 'border-steel/55 bg-ink/25 hover:border-accent/35 hover:bg-steel/15 hover:shadow-[0_8px_24px_-12px] hover:shadow-black/40'

  return (
    <button type="button" onClick={onClick} className={`${base} ${state} ${className}`.trim()}>
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
        aria-hidden
      />
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-mist">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums tracking-tight text-fog sm:text-3xl">
        {value ?? 0}
      </p>
    </button>
  )
}
