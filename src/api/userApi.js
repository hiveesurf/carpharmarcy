import { apiDelete, apiGet, apiPost, apiPut, apiV1Base, refreshSessionWithCookie } from './client.js'
import { getAccessToken } from '../lib/authTokens.js'
import { getApiSessionId } from './session.js'

export function getProfile() {
  return apiGet('/user/profile')
}

export function putProfile(body) {
  return apiPut('/user/profile', body)
}

export function getAddresses() {
  return apiGet('/addresses')
}

export function postAddress(body) {
  return apiPost('/addresses', body)
}

export function putAddress(id, body) {
  return apiPut(`/addresses/${encodeURIComponent(id)}`, body)
}

export function deleteAddress(id) {
  return apiDelete(`/addresses/${encodeURIComponent(id)}`)
}

/** @param {File | Blob} file */
export async function postAvatar(file) {
  const base = apiV1Base()
  if (!base) throw new Error('API_UNAVAILABLE')
  const run = () => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`${base}/user/avatar`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        'X-Guest-Session': getApiSessionId(),
      },
      body: fd,
    })
  }
  let res = await run()
  if (res.status === 401) {
    const r = await refreshSessionWithCookie()
    if (r.ok) res = await run()
  }
  const payload = await res.json().catch(() => ({}))
  if (!res.ok || !payload.success) {
    throw new Error(payload.error?.message || 'Upload failed')
  }
  return payload.data
}
