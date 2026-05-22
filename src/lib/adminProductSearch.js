/**
 * Case-insensitive match for admin product list search (name, SKU, brand, part number).
 * @param {Record<string, unknown> | null | undefined} product
 * @param {string} query
 */
export function matchesAdminProductSearch(product, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q || !product) return !q

  const fields = [
    product.name,
    product.sku,
    product.brand,
    product.partNumber,
    product.part_number,
  ]

  return fields.some((f) => String(f ?? '').toLowerCase().includes(q))
}
