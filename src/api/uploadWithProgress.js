import { apiV1Base } from './client.js'
import { getAccessToken } from '../lib/authTokens.js'
import { getApiSessionId } from './session.js'
import { toUserFacingApiError } from '../lib/apiUserMessage.js'

/**
 * Upload a file using XHR (fetch lacks upload progress events).
 *
 * @param {string} path - API path, e.g. `/admin/products/import-excel`
 * @param {FormData} formData
 * @param {{ onUploadProgress?: (pct: number) => void }} [opts]
 * @returns {Promise<{ success: true, data: unknown }>}
 */
export function uploadWithProgress(path, formData, { onUploadProgress } = {}) {
  return new Promise((resolve, reject) => {
    const base = apiV1Base()
    if (!base) {
      const err = new Error('API_UNAVAILABLE')
      err.code = 'API_UNAVAILABLE'
      reject(err)
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${base}${path}`, true)

    const at = getAccessToken()
    if (at) xhr.setRequestHeader('Authorization', `Bearer ${at}`)
    xhr.setRequestHeader('X-Guest-Session', getApiSessionId())
    // Do NOT set Content-Type — XHR sets multipart/form-data + boundary automatically

    xhr.withCredentials = true

    if (onUploadProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
    }

    xhr.onload = () => {
      let payload = {}
      try {
        const text = xhr.responseText
        if (text && text.trim().startsWith('{')) payload = JSON.parse(text)
      } catch {
        payload = {}
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload.success) {
        resolve(payload)
      } else {
        const { message, code, requestId } = toUserFacingApiError(payload, xhr.status)
        const err = new Error(message)
        err.status = xhr.status
        err.code = code
        err.requestId = requestId
        err.payload = payload
        reject(err)
      }
    }

    xhr.onerror = () => {
      const err = new Error('Network error during upload')
      err.code = 'NETWORK_ERROR'
      reject(err)
    }

    xhr.send(formData)
  })
}
