import { useCallback, useState } from 'react'

function fallbackSeed(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) | 0
  return `autox${Math.abs(h)}`
}

const BLANK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect fill="#f8f9fa" width="800" height="600"/><text x="400" y="300" fill="#ff6b35" font-family="system-ui" font-size="22" text-anchor="middle">carpharmacy</text></svg>`,
  )

function shouldTryPicsumFallback(failedSrc) {
  if (!failedSrc || failedSrc.startsWith('data:')) return false
  if (typeof window === 'undefined') return true
  try {
    const resolved = new URL(failedSrc, window.location.href)
    return resolved.origin !== window.location.origin
  } catch {
    return false
  }
}

/**
 * External URLs: Unsplash etc. may block hotlinking — try Picsum, then inline SVG.
 * Same-origin / local public assets: skip Picsum (avoids misleading random stock photos on 404).
 */
export function SafeImg({ src, alt, fw = 800, fh = 600, className = '', ...rest }) {
  const [phase, setPhase] = useState(0)

  const onError = useCallback(() => {
    setPhase((p) => {
      if (p === 0) return shouldTryPicsumFallback(src) ? 1 : 2
      return Math.min(p + 1, 2)
    })
  }, [src])

  const url =
    phase === 0
      ? src
      : phase === 1
        ? `https://picsum.photos/seed/${fallbackSeed(src)}/${fw}/${fh}`
        : BLANK

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      referrerPolicy={url.startsWith('http') && !url.startsWith(typeof window !== 'undefined' ? window.location.origin : '') ? 'no-referrer' : undefined}
      onError={phase < 2 ? onError : undefined}
      {...rest}
    />
  )
}
