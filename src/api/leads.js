import { apiPost } from './client.js'

export function submitSellerLead(body) {
  return apiPost('/leads/seller', body, { skipAuth: true })
}
