/**
 * Low-level HTTP accessors. UI should prefer `src/services/*`.
 */
export {
  apiV1Base,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  apiRequest,
  refreshSessionWithCookie,
} from './client.js'
export { getApiSessionId } from './session.js'
export * as authApi from './authApi.js'
export * as productApi from './productApi.js'
export * as cartApi from './cartApi.js'
export * as orderApi from './orderApi.js'
export * as userApi from './userApi.js'
export * as wishlistApi from './wishlistApi.js'
export * as categoryApi from './categoryApi.js'
export * as adminApi from './adminApi.js'
