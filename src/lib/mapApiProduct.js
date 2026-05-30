/**
 * Map mock API product rows to shapes used by parts UI and vehicle listings.
 */

import { mapApiProductGallery, resolveProductPrimaryImageUrl } from './productImage.js'
import { resolveApiAssetUrl } from './resolveApiAssetUrl.js'

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
  const primary = resolveProductPrimaryImageUrl(api)
  const resolvedPrimary = primary ? resolveApiAssetUrl(primary) : undefined
  if (resolvedPrimary) row.imageUrl = resolvedPrimary
  const galleryUrls = mapApiProductGallery(api, api.name || api.sku || 'Product')
  if (galleryUrls.length > 0) row.galleryUrls = galleryUrls
  if (typeof api.description === 'string' && api.description.trim()) {
    row.apiDescription = api.description.trim()
  }
  if (api.brand != null && String(api.brand).trim()) row.brand = String(api.brand).trim()
  if (api.partNumber != null && String(api.partNumber).trim()) {
    row.partNumber = String(api.partNumber).trim()
  }
  if (api.unitVolume != null && String(api.unitVolume).trim()) {
    row.unitVolume = String(api.unitVolume).trim()
  }
  if (api.supplierName != null && String(api.supplierName).trim()) {
    row.supplierName = String(api.supplierName).trim()
  }
  if (api.discountedPrice != null && api.discountedPrice !== api.price) {
    row.discountedPrice = api.discountedPrice
  }
  return row
}

export function apiVehicleToCar(api) {
  const m = api.carMeta || {}
  const imageRaw = resolveProductPrimaryImageUrl(api) || api.image || ''
  const image = resolveApiAssetUrl(imageRaw) || imageRaw
  const gallery =
    mapApiProductGallery(api, api.imageAlt || api.name).length > 0
      ? mapApiProductGallery(api, api.imageAlt || api.name)
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
