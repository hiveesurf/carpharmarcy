/** Trim and collapse internal whitespace. */
export function normalizeCarText(value) {
  if (value == null) return ''
  return String(value).trim().replace(/\s+/g, ' ')
}

/** Case-insensitive key for deduplication and comparison. */
export function carIdentityKey(value) {
  return normalizeCarText(value).toLowerCase()
}

/** Title Case per word (e.g. "audi" → "Audi", "land rover" → "Land Rover"). */
export function toTitleCaseWords(value) {
  const t = normalizeCarText(value)
  if (!t) return ''
  return t
    .split(' ')
    .map((word) => {
      if (!word) return ''
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .filter(Boolean)
    .join(' ')
}

/** Canonical brand (make) display and storage format. */
export function normalizeCarBrand(value) {
  return toTitleCaseWords(value)
}

/** Canonical model / variant display and storage format. */
export function normalizeCarIdentityField(value) {
  return toTitleCaseWords(value)
}

/**
 * Deduplicate brand labels case-insensitively; each key maps to Title Case.
 * @param {Iterable<string | null | undefined>} makes
 */
export function dedupeBrandLabels(makes) {
  const byKey = new Map()
  for (const raw of makes) {
    if (raw == null || raw === '') continue
    const key = carIdentityKey(raw)
    if (!key) continue
    byKey.set(key, normalizeCarBrand(raw))
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

/** @param {{ make?: string | null }[]} cars */
export function dedupeBrandLabelsFromCars(cars) {
  return dedupeBrandLabels((cars || []).map((c) => c.make))
}
