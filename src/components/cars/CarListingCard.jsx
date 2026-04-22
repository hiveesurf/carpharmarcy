import { formatInr } from '../../data/partsCatalog'
import { CONDITION_LABEL, openCarEnquiry } from '../../data/carsCatalog'
import { SafeImg } from '../ui/SafeImg'
import { Button } from '../ui/Button'

export function CarListingCard({ car, onViewDetails, onViewParts }) {
  return (
    <article className="ad-store-card flex h-full flex-col overflow-hidden rounded-xl border border-steel/70 bg-ink/95 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-16px_rgba(0,51,102,0.18)]">
      <button
        type="button"
        onClick={() => onViewDetails(car.id)}
        className="group relative aspect-[16/10] w-full overflow-hidden bg-slate text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <SafeImg
          src={car.image}
          alt={car.imageAlt}
          fw={960}
          fh={600}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          width={800}
          height={500}
          loading="lazy"
        />
        <span
          className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider shadow-md ${
            car.condition === 'first-hand'
              ? 'bg-hud/95 text-white'
              : 'bg-flare/95 text-[var(--color-on-accent)]'
          }`}
        >
          {CONDITION_LABEL[car.condition]}
        </span>
        <span className="sr-only">View details for {car.title}</span>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
          {car.year} · {car.km.toLocaleString('en-IN')} km · {car.location}
        </p>
        <h3 className="mt-1 font-display text-base font-bold uppercase leading-snug text-fog">{car.title}</h3>
        <p className="mt-3 font-display text-xl font-black text-accent">{formatInr(car.price)}</p>

        <div className="mt-4 flex flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(car.id)}
            className="w-full rounded-xl border border-steel/80 py-2.5 font-sans text-xs font-bold uppercase tracking-wide text-fog transition-colors hover:border-accent/50 hover:text-accent sm:flex-1"
          >
            View details
          </button>
          <Button
            variant="secondary"
            size="md"
            type="button"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onViewParts?.(car)
            }}
          >
            View related parts
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            className="w-full sm:flex-1"
            onClick={(e) => {
              e.stopPropagation()
              openCarEnquiry(car)
            }}
          >
            Enquiry
          </Button>
        </div>
      </div>
    </article>
  )
}
