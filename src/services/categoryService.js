import * as categoryApi from '../api/categoryApi.js'
import { apiV1Base } from '../api/client.js'

export async function fetchCategories() {
  if (!apiV1Base()) return null
  const { data } = await categoryApi.getCategories()
  return data.items
}
