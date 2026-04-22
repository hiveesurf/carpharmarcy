import { apiPost, apiV1Base } from '../api/client.js'

export async function initiatePayment(body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await apiPost('/payments/initiate', body ?? {})
  return data
}

export async function confirmPayment(body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await apiPost('/payments/confirm', body ?? {})
  return data
}
