/**
 * Map mock API product rows to shapes used by parts UI and vehicle listings.
 */

export function mapApiProductToPart(api) {
  const compatibleCars = api.compatibleCars?.length ? api.compatibleCars : ['All vehicles']
  const row = {
    id: api.id,
    sku: api.sku,
    name: api.name,
    category: api.category,
    price: api.price,
    totalStock: api.totalStock ?? 1,
    imageKey: api.imageKey || 'brakes',
    compatibleCars,
  }
  if (api.image) row.imageUrl = api.image
  const urls = []
  if (api.image) urls.push({ src: api.image, alt: api.imageAlt || api.name })
  if (Array.isArray(api.gallery)) {
    for (const g of api.gallery) {
      if (g?.src && !urls.some((u) => u.src === g.src)) urls.push({ src: g.src, alt: g.alt || api.name })
    }
  }
  if (urls.length > 0) row.galleryUrls = urls
  if (typeof api.description === 'string' && api.description.trim()) {
    row.apiDescription = api.description.trim()
  }
  return row
}

export function apiVehicleToCar(api) {
  const m = api.carMeta || {}
  const image = api.image || ''
  const gallery =
    Array.isArray(api.gallery) && api.gallery.length > 0
      ? api.gallery
      : image
        ? [{ src: image, alt: api.imageAlt || api.name }]
        : []
  return {
    id: api.id,
    title: api.name,
    year: m.year ?? new Date().getFullYear(),
    price: api.price,
    condition: m.condition || 'second-hand',
    km: m.km ?? 0,
    fuel: m.fuel || '—',
    transmission: m.transmission || '—',
    location: m.location || '—',
    image,
    imageAlt: api.imageAlt || api.name,
    gallery,
    description: api.description || '',
  }
}
