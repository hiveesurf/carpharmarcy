import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client.js'

export function adminLogin(body) {
  return apiPost('/admin/auth/login', body, { skipAuth: true })
}

export function adminDashboard() {
  return apiGet('/admin/dashboard')
}

/**
 * @param {{ page?: number, pageSize?: number, sort?: string }} [query]
 */
export function adminListProducts(query = {}) {
  const page = query.page ?? 0
  const pageSize = query.pageSize ?? 20
  const sort = query.sort ?? 'created_desc'
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort: String(sort),
  })
  return apiGet(`/admin/products?${q}`)
}

export function adminGetProduct(id) {
  return apiGet(`/admin/products/${encodeURIComponent(id)}`)
}

export function adminCreateProduct(body) {
  return apiPost('/admin/products', body)
}

export function adminUpdateProduct(id, body) {
  return apiPut(`/admin/products/${encodeURIComponent(id)}`, body)
}

export function adminDeleteProduct(id) {
  return apiDelete(`/admin/products/${encodeURIComponent(id)}`)
}

export function adminPublishProduct(id, published = true) {
  return apiPatch(`/admin/products/${encodeURIComponent(id)}/publish`, { published })
}

export function adminListCategories({ page = 0, size = 5 } = {}) {
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('size', String(size))
  return apiGet(`/admin/categories?${q.toString()}`)
}

export function adminCategoriesOverview() {
  return apiGet('/admin/categories/overview')
}

export function adminCreateCategory(body) {
  return apiPost('/admin/categories', body)
}

export function adminUpdateCategory(id, body) {
  return apiPut(`/admin/categories/${encodeURIComponent(id)}`, body)
}

export function adminDeleteCategory(id) {
  return apiDelete(`/admin/categories/${encodeURIComponent(id)}`)
}

export function adminListOrders({ page = 0, size = 5, phone } = {}) {
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('size', String(size))
  if (phone) q.set('phone', String(phone))
  return apiGet(`/admin/orders?${q.toString()}`)
}

export function adminListCars(query = {}) {
  const q = new URLSearchParams()
  q.set('page', String(query.page ?? 0))
  q.set('size', String(query.size ?? 5))
  if (query.published === true) q.set('published', 'true')
  if (query.brand) q.set('brand', String(query.brand))
  const s = q.toString()
  return apiGet(`/admin/cars${s ? `?${s}` : ''}`)
}

export function adminGetCar(id) {
  return apiGet(`/admin/cars/${encodeURIComponent(id)}`)
}

export function adminCreateCar(body) {
  return apiPost('/admin/cars', body)
}

export function adminUpdateCar(id, body) {
  return apiPut(`/admin/cars/${encodeURIComponent(id)}`, body)
}

export function adminDeleteCar(id) {
  return apiDelete(`/admin/cars/${encodeURIComponent(id)}`)
}

export function adminPatchOrderStatus(id, status) {
  return apiPatch(`/admin/orders/${encodeURIComponent(id)}/status`, { status })
}

export function adminListUsers({ page = 0, size = 5 } = {}) {
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('size', String(size))
  return apiGet(`/admin/users?${q.toString()}`)
}

export function adminGetUser(id) {
  return apiGet(`/admin/users/${encodeURIComponent(id)}`)
}

export function adminListEmployees({ page = 0, size = 5 } = {}) {
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('size', String(size))
  return apiGet(`/admin/employees?${q.toString()}`)
}

export function adminCreateEmployee(body) {
  return apiPost('/admin/employees', body)
}

export function adminSetEmployeeAvailability(phone, availability) {
  return apiPatch(`/admin/employees/${encodeURIComponent(phone)}/availability`, { availability })
}

export function adminAssignDelivery(orderId, deliveryAdminEmail) {
  return apiPatch(`/admin/orders/${encodeURIComponent(orderId)}/assign-delivery`, { deliveryAdminEmail })
}

export function adminListDeliveryOrders() {
  return apiGet('/admin/delivery/orders')
}

export function adminProductAudit(id) {
  return apiGet(`/admin/products/${encodeURIComponent(id)}/audit`)
}

/**
 * Bulk-import products from an .xlsx file.
 * Uses XHR for upload-progress support.
 * @param {File} file
 * @param {{ category?: string, onUploadProgress?: (pct: number) => void }} [opts]
 */
export async function adminBulkImportProducts(file, { category, onUploadProgress } = {}) {
  const { uploadWithProgress } = await import('./uploadWithProgress.js')
  const fd = new FormData()
  fd.append('file', file)
  const path = category
    ? `/admin/products/import-excel?category=${encodeURIComponent(category)}`
    : '/admin/products/import-excel'
  return uploadWithProgress(path, fd, { onUploadProgress })
}
