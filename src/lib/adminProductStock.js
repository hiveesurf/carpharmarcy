/** Default threshold (units) for admin low-stock warnings. */
export const ADMIN_LOW_STOCK_THRESHOLD = 5

/**
 * @param {Record<string, unknown> | null | undefined} product
 * @param {number} [threshold]
 */
export function isAdminLowStock(product, threshold = ADMIN_LOW_STOCK_THRESHOLD) {
  return Number(product?.totalStock ?? 0) <= threshold
}
