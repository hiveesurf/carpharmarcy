/** @param {Record<string, unknown> | null | undefined} product */
export function metadataFromProduct(product) {
  if (!product || typeof product !== 'object') return {}
  const raw = product.metadata
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...raw }
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...parsed } : {}
    } catch {
      return {}
    }
  }
  return {}
}

/** @param {Record<string, unknown> | null | undefined} product */
function galleryExtrasFromProduct(product) {
  const g = product?.gallery
  if (!Array.isArray(g)) return []
  const out = []
  let i = 0
  for (const item of g) {
    const src = item && typeof item === 'object' ? item.src : String(item ?? '')
    if (!src) continue
    const alt = item && typeof item === 'object' && item.alt ? item.alt : `Photo ${i + 1}`
    out.push({ src, alt })
    i++
  }
  return out
}

/** @param {Record<string, unknown> | null | undefined} product */
function carMetaFromProduct(product) {
  const cm = product?.carMeta
  if (cm && typeof cm === 'object' && !Array.isArray(cm)) {
    return { ...cm }
  }
  return {}
}

/**
 * Builds a full admin PUT body so {@link upsertProduct} does not zero out missing fields.
 * @param {Record<string, unknown>} product from getProduct
 * @param {Record<string, unknown>} [overrides]
 */
export function buildAdminProductUpdateBody(product, overrides = {}) {
  const p = product ?? {}
  const md = metadataFromProduct(p)
  const type = String(p.type ?? 'part')
  const mergedOverrides = { ...overrides }

  const body = {
    type,
    category: String(p.category ?? 'Misc').trim() || 'Misc',
    sku: String(p.sku ?? '').trim(),
    name: String(p.name ?? '').trim(),
    price: Number(p.actualPrice ?? p.price ?? 0) || 0,
    purchasePrice: Number(p.purchasePrice ?? 0) || 0,
    totalStock: Math.max(0, Math.floor(Number(p.totalStock ?? 0))),
    published: !!p.published,
  }

  if (type === 'part') {
    body.imageKey = p.imageKey && String(p.imageKey) ? String(p.imageKey) : 'brakes'
    body.compatibleCarIds = Array.isArray(p.compatibleCarIds) ? p.compatibleCarIds : []
    body.galleryExtras = galleryExtrasFromProduct(p)
    body.brand = String(p.brand ?? md.brand ?? '').trim()
    body.partNumber = String(p.partNumber ?? md.partNumber ?? '').trim()
    body.unitVolume = String(p.unitVolume ?? md.unitVolume ?? '').trim()
    body.supplierName = String(p.supplierName ?? md.supplierName ?? '').trim()
    if (typeof p.description === 'string' && p.description.trim()) {
      body.description = p.description.trim()
    }
  } else if (type === 'vehicle') {
    const carMeta = carMetaFromProduct(p)
    if (Object.keys(carMeta).length > 0) {
      body.carMeta = carMeta
    }
    const metaPatch =
      mergedOverrides.metadata && typeof mergedOverrides.metadata === 'object'
        ? mergedOverrides.metadata
        : null
    if (metaPatch) {
      delete mergedOverrides.metadata
    }
    const vehicleMd = { ...md, ...(metaPatch ?? {}) }
    if (Object.keys(vehicleMd).length > 0) {
      body.metadata = vehicleMd
    }
    if (typeof p.description === 'string') {
      body.description = p.description
    }
  }

  return { ...body, ...mergedOverrides }
}
