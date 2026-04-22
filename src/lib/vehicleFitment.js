/** Derive hero fitment options from raw parts JSON (shared with mock API logic). */

export function slugBrand(s) {
  return String(s)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function deriveBrandsFromParts(parts) {
  const names = new Set()
  for (const p of parts) {
    for (const line of p.compatibleCars || []) {
      if (line === 'All vehicles') continue
      const first = line.split(/\s+/)[0]
      if (first) names.add(first)
    }
  }
  return [...names]
    .sort()
    .map((name) => ({ id: slugBrand(name), name }))
}

export function modelsForBrandFromParts(parts, brandId) {
  const brands = deriveBrandsFromParts(parts)
  const brand = brands.find((b) => b.id === brandId)
  if (!brand) return []
  const seen = new Set()
  const out = []
  for (const p of parts) {
    for (const line of p.compatibleCars || []) {
      if (line === 'All vehicles' || !line.startsWith(`${brand.name} `)) continue
      if (seen.has(line)) continue
      seen.add(line)
      out.push({
        id: slugBrand(line),
        name: line.slice(brand.name.length + 1).trim() || line,
        fullName: line,
      })
    }
  }
  return out.sort((a, b) => a.fullName.localeCompare(b.fullName))
}
