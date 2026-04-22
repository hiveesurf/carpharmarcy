import * as adminApi from '../api/adminApi.js'
import { apiV1Base } from '../api/client.js'

export async function loginAdmin(email, password) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  return adminApi.adminLogin({ email, password })
}

export async function dashboard() {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminDashboard()
  return data
}

/**
 * @param {{ page?: number, pageSize?: number, sort?: string }} [params]
 * @returns {Promise<{ items: unknown[], page: number, pageSize: number, total: number, totalPages: number }>}
 */
export async function listProductsPage(params = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminListProducts(params)
  const d = data && typeof data === 'object' ? data : {}
  return {
    items: Array.isArray(d.items) ? d.items : [],
    page: typeof d.page === 'number' ? d.page : 0,
    pageSize: typeof d.pageSize === 'number' ? d.pageSize : 20,
    total: typeof d.total === 'number' ? d.total : 0,
    totalPages: typeof d.totalPages === 'number' ? d.totalPages : 0,
    hasMore:
      typeof d.hasMore === 'boolean'
        ? d.hasMore
        : typeof d.page === 'number' && typeof d.totalPages === 'number'
          ? d.page + 1 < d.totalPages
          : false,
    nextPage:
      typeof d.nextPage === 'number'
        ? d.nextPage
        : typeof d.page === 'number'
          ? d.page + 1
          : 1,
  }
}

export async function getProduct(id) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminGetProduct(id)
  return data && typeof data === 'object' ? data : null
}

export async function updateProduct(id, body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminUpdateProduct(id, body)
  return data?.product ?? null
}

export async function publishProduct(id, published) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminPublishProduct(id, published)
  return data?.product ?? null
}

export async function removeProduct(id) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  await adminApi.adminDeleteProduct(id)
}

export async function createProduct(body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminCreateProduct(body)
  return data?.product ?? null
}

export async function listCategories() {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  let page = 0
  let hasMore = true
  const merged = []
  while (hasMore) {
    const { data } = await adminApi.adminListCategories({ page, size: 50 })
    const d = data && typeof data === 'object' ? data : {}
    const items = Array.isArray(d.items) ? d.items.filter((x) => !x?.deleted) : []
    merged.push(...items)
    hasMore = Boolean(d.hasMore)
    page = typeof d.nextPage === 'number' ? d.nextPage : page + 1
  }
  return merged
}

export async function listCategoriesPage({ page = 0, size = 5 } = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminListCategories({ page, size })
  const d = data && typeof data === 'object' ? data : {}
  return {
    items: Array.isArray(d.items) ? d.items : [],
    page: typeof d.page === 'number' ? d.page : page,
    size: typeof d.size === 'number' ? d.size : size,
    hasMore: Boolean(d.hasMore),
    nextPage: typeof d.nextPage === 'number' ? d.nextPage : page + 1,
  }
}

export async function categoriesOverview() {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminCategoriesOverview()
  return data && typeof data === 'object' ? data : { summary: {}, categories: [] }
}

export async function createCategory(name) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminCreateCategory({ name })
  return data?.category ?? null
}

export async function removeCategory(id) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  await adminApi.adminDeleteCategory(id)
}

export async function listOrders({ page = 0, size = 5, phone } = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminListOrders({ page, size, phone })
  const d = data && typeof data === 'object' ? data : {}
  return {
    items: Array.isArray(d.items) ? d.items : [],
    page: typeof d.page === 'number' ? d.page : page,
    size: typeof d.size === 'number' ? d.size : size,
    hasMore: Boolean(d.hasMore),
    nextPage: typeof d.nextPage === 'number' ? d.nextPage : page + 1,
  }
}

export async function listCars(params = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  let page = 0
  let hasMore = true
  const merged = []
  while (hasMore) {
    const { data } = await adminApi.adminListCars({ ...params, page, size: 50 })
    const d = data && typeof data === 'object' ? data : {}
    const items = Array.isArray(d.items) ? d.items.filter((x) => !x?.deleted) : []
    merged.push(...items)
    hasMore = Boolean(d.hasMore)
    page = typeof d.nextPage === 'number' ? d.nextPage : page + 1
  }
  return merged
}

export async function listCarsPage(params = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminListCars(params)
  const d = data && typeof data === 'object' ? data : {}
  return {
    items: Array.isArray(d.items) ? d.items : [],
    page: typeof d.page === 'number' ? d.page : params.page ?? 0,
    size: typeof d.size === 'number' ? d.size : params.size ?? 5,
    hasMore: Boolean(d.hasMore),
    nextPage: typeof d.nextPage === 'number' ? d.nextPage : (params.page ?? 0) + 1,
  }
}

export async function getCar(id) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminGetCar(id)
  return data?.car ?? null
}

export async function createCar(body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminCreateCar(body)
  return data?.car ?? null
}

export async function updateCar(id, body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminUpdateCar(id, body)
  return data?.car ?? null
}

export async function removeCar(id) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  await adminApi.adminDeleteCar(id)
}

export async function patchOrderStatus(id, status) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminPatchOrderStatus(id, status)
  return data?.order ?? null
}

export async function listUsers() {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  let page = 0
  let hasMore = true
  const merged = []
  while (hasMore) {
    const { data } = await adminApi.adminListUsers({ page, size: 50 })
    const d = data && typeof data === 'object' ? data : {}
    const items = Array.isArray(d.items) ? d.items : []
    merged.push(...items)
    hasMore = Boolean(d.hasMore)
    page = typeof d.nextPage === 'number' ? d.nextPage : page + 1
  }
  return merged
}

export async function listUsersPage({ page = 0, size = 5 } = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminListUsers({ page, size })
  const d = data && typeof data === 'object' ? data : {}
  return {
    items: Array.isArray(d.items) ? d.items : [],
    page: typeof d.page === 'number' ? d.page : page,
    size: typeof d.size === 'number' ? d.size : size,
    hasMore: Boolean(d.hasMore),
    nextPage: typeof d.nextPage === 'number' ? d.nextPage : page + 1,
  }
}

export async function listEmployees() {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  let page = 0
  let hasMore = true
  const merged = []
  while (hasMore) {
    const { data } = await adminApi.adminListEmployees({ page, size: 50 })
    const d = data && typeof data === 'object' ? data : {}
    const items = Array.isArray(d.items) ? d.items : []
    merged.push(...items)
    hasMore = Boolean(d.hasMore)
    page = typeof d.nextPage === 'number' ? d.nextPage : page + 1
  }
  return merged
}

export async function listEmployeesPage({ page = 0, size = 5 } = {}) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminListEmployees({ page, size })
  const d = data && typeof data === 'object' ? data : {}
  return {
    items: Array.isArray(d.items) ? d.items : [],
    page: typeof d.page === 'number' ? d.page : page,
    size: typeof d.size === 'number' ? d.size : size,
    hasMore: Boolean(d.hasMore),
    nextPage: typeof d.nextPage === 'number' ? d.nextPage : page + 1,
  }
}

export async function createEmployee(body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminCreateEmployee(body)
  return data?.employee ?? null
}

export async function setEmployeeAvailability(phone, availability) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminSetEmployeeAvailability(phone, availability)
  return data?.employee ?? null
}

export async function assignDelivery(orderId, deliveryAdminEmail) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminAssignDelivery(orderId, deliveryAdminEmail)
  return data ?? null
}

export async function listDeliveryOrders() {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminListDeliveryOrders()
  return data?.items ?? []
}

export async function listProductAudit(id) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await adminApi.adminProductAudit(id)
  return data?.items ?? []
}
