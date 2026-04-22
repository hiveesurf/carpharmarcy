import * as userApi from '../api/userApi.js'
import { apiV1Base } from '../api/client.js'

export async function loadProfile() {
  if (!apiV1Base()) return null
  const { data } = await userApi.getProfile()
  return data
}

export async function saveProfile(body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await userApi.putProfile(body)
  return data.profile
}

export async function loadAddresses() {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await userApi.getAddresses()
  return data.items
}

export async function postUserAvatar(file) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  return userApi.postAvatar(file)
}

export async function createAddress(body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await userApi.postAddress(body)
  return data.address
}

export async function updateAddress(id, body) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  const { data } = await userApi.putAddress(id, body)
  return data.address
}

export async function deleteAddress(id) {
  if (!apiV1Base()) throw new Error('API_UNAVAILABLE')
  await userApi.deleteAddress(id)
}
