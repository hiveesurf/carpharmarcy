import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'

export function VehicleMultiSelect({
  cars,
  selectedCarIds,
  onChange,
  label = 'Compatible vehicles',
  placeholder = 'Search brand/model',
  emptyText = 'No vehicles available.',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cars
    return cars.filter((c) => {
      const hay = `${c.make ?? ''} ${c.model ?? ''} ${c.variant ?? ''} ${c.id ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [cars, query])

  const selectedSet = useMemo(() => new Set(selectedCarIds), [selectedCarIds])
  const selectedRows = useMemo(() => cars.filter((c) => selectedSet.has(c.id)), [cars, selectedSet])

  function toggle(id) {
    if (!id) return
    if (selectedSet.has(id)) {
      onChange(selectedCarIds.filter((x) => x !== id))
    } else {
      onChange([...selectedCarIds, id])
    }
  }

  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border border-steel/80 bg-ink/40 px-3 py-2 text-left font-sans text-sm text-fog"
      >
        <span>
          {selectedRows.length > 0 ? `${selectedRows.length} selected` : 'Select vehicles'}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-mist" />
      </button>

      {selectedRows.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedRows.map((car) => (
            <span key={car.id} className="inline-flex items-center gap-1 rounded-full border border-steel/70 bg-ink/40 px-2 py-1 text-[11px] text-fog">
              {car.make} {car.model}
              <button
                type="button"
                onClick={() => toggle(car.id)}
                className="text-mist hover:text-flare"
                aria-label={`Remove ${car.make} ${car.model}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-full border border-steel/60 px-2 py-1 text-[11px] text-mist hover:border-flare/40 hover:text-flare"
          >
            Clear all
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="relative z-[60] mt-2 rounded-xl border border-steel/50 bg-[#ffffff] p-3 opacity-100 shadow-lg [backdrop-filter:none]">
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-steel/70 bg-[#ffffff] px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500"
            />
          </div>
          <div className="max-h-52 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-neutral-600">{emptyText}</p>
            ) : (
              filtered.map((car) => {
                const checked = selectedSet.has(car.id)
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => toggle(car.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-transparent px-2 py-1.5 text-left text-xs text-neutral-900 hover:border-steel/60 hover:bg-neutral-100"
                  >
                    <span>
                      {car.make} {car.model}
                      {car.variant ? ` - ${car.variant}` : ''} ({car.id})
                    </span>
                    {checked ? <Check className="h-3.5 w-3.5 text-accent" /> : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
