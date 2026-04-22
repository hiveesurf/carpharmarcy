import { apiV1Base } from '../api/client.js'
import { submitSellerLead as postSellerLead } from '../api/leads.js'

export async function submitSellerLead(body) {
  if (!apiV1Base()) {
    throw new Error('API not configured (set VITE_API_BASE or run Vite dev with Spring on :8080).')
  }
  return postSellerLead(body)
}
