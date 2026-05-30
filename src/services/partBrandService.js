import { apiGet } from '../api/client.js'
import { apiV1Base } from '../api/client.js'

export async function fetchPartBrands() {
  if (!apiV1Base()) return []
  const { data } = await apiGet('/part-brands')
  return data?.items ?? []
}
