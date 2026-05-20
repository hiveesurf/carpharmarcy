export function AdminStatCard({ label, value, icon: Icon, accent = 'text-hud', tone = 'default' }) {
  const toneRing =
    tone === 'online'
      ? 'ring-emerald-500/25'
      : tone === 'offline'
        ? 'ring-steel/50'
        : tone === 'joined'
          ? 'ring-flare/25'
          : 'ring-hud/20'

  return (
    <div
      className={`admin-card flex h-full min-h-[7.5rem] flex-col justify-between gap-3 rounded-2xl p-4 ring-1 sm:p-5 ${toneRing}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-mist">{label}</p>
        {Icon ? <Icon className={`h-4 w-4 shrink-0 ${accent}`} strokeWidth={2} aria-hidden /> : null}
      </div>
      <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-fog sm:text-3xl">
        {value ?? 0}
      </p>
    </div>
  )
}
