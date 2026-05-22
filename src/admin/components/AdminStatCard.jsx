export function AdminStatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-hud',
  tone = 'default',
  helper,
}) {
  const toneRing =
    tone === 'online'
      ? 'ring-emerald-500/25'
      : tone === 'offline'
        ? 'ring-steel/50'
        : tone === 'joined'
          ? 'ring-flare/25'
          : 'ring-hud/20'

  const iconBadgeBg =
    tone === 'joined'
      ? 'bg-flare/10 ring-flare/20'
      : tone === 'offline'
        ? 'bg-steel/20 ring-steel/30'
        : tone === 'online'
          ? 'bg-emerald-500/10 ring-emerald-500/20'
          : 'bg-accent/10 ring-accent/20'

  return (
    <div
      className={`admin-card flex h-full min-h-[7.75rem] flex-col justify-between gap-3 rounded-2xl p-4 ring-1 sm:min-h-[8.25rem] sm:p-5 ${toneRing}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-mist">{label}</p>
          {helper ? <p className="mt-1 text-[11px] leading-snug text-mist/90">{helper}</p> : null}
        </div>
        {Icon ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${iconBadgeBg}`}
            aria-hidden
          >
            <Icon className={`h-4 w-4 ${accent}`} strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-fog sm:text-3xl">
        {value ?? 0}
      </p>
    </div>
  )
}
