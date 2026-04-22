import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Section } from '../ui/Section'
import { sectionBackdrops } from '../../content/media'
import { CarDetailOverlay } from '../cars/CarDetailOverlay'
import { CarListingCard } from '../cars/CarListingCard'
import { CARS_CATALOG, CARS_FEATURED_HOME } from '../../data/carsCatalog'

export function BuyCarsSection() {
  const [detailId, setDetailId] = useState(null)
  const featured = CARS_CATALOG.slice(0, CARS_FEATURED_HOME)

  return (
    <>
      <Section
        id="buy-cars"
        eyebrow="Vehicles"
        title="Buy cars"
        subtitle="Verified first-hand and pre-owned stock — tap a card for photos and specs, or send an enquiry straight from the listing."
        backdrop={sectionBackdrops.buyCars}
        titleAction={
          <Link
            to="/cars"
            className="inline-flex shrink-0 items-center rounded-xl border border-steel/80 bg-ink/80 px-5 py-2.5 font-sans text-sm font-semibold text-fog shadow-md backdrop-blur-sm transition-[transform,filter,border-color] hover:border-accent/50 hover:text-accent active:scale-[0.98]"
          >
            View all
          </Link>
        }
      >
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((car) => (
            <li key={car.id}>
              <CarListingCard car={car} onViewDetails={setDetailId} />
            </li>
          ))}
        </ul>
      </Section>

      <CarDetailOverlay carId={detailId} onClose={() => setDetailId(null)} />
    </>
  )
}
