import { useEffect, useState } from 'react'
import { apiV1Base } from '../../api/client.js'
import { getAccessToken } from '../../lib/authTokens.js'
import { resolveApiAssetUrl } from '../../lib/resolveApiAssetUrl.js'

/**
 * Loads an admin-authenticated image (e.g. delivery proof) via Bearer token.
 */
export function AuthenticatedApiImage({ path, alt = '', className = '' }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!path) {
      setSrc(null)
      return undefined
    }
    let cancelled = false
    let blobUrl = null

    async function load() {
      const base = apiV1Base()
      const resolved = resolveApiAssetUrl(path)
      if (!base || !resolved) return
      const token = getAccessToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const res = await fetch(resolved, { headers, credentials: 'include' })
        if (!res.ok) return
        const blob = await res.blob()
        if (cancelled) return
        blobUrl = URL.createObjectURL(blob)
        setSrc(blobUrl)
      } catch {
        if (!cancelled) setSrc(null)
      }
    }

    void load()
    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [path])

  if (!src) return null
  return <img src={src} alt={alt} className={className} />
}
