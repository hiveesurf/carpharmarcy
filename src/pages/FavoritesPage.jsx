import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Heart } from 'lucide-react'
import { publicUrl } from '../lib/publicUrl'
import { useAuth } from '../context/useAuth'
import { loadWishlist, toggleWishlistProduct } from '../services/wishlistService.js'
import { mapApiProductToPart } from '../lib/mapApiProduct.js'
import { formatInr, getPartImage } from '../data/partsCatalog'
import { SafeImg } from '../components/ui/SafeImg'
import { getFetchErrorMessage } from '../lib/apiErrorMessage.js'
import { apiV1Base } from '../api/client.js'

export function FavoritesPage() {
  const { user, authHydrated, openAuth } = useAuth()
  const useApi = Boolean(apiV1Base())
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!useApi || !user) return
    setLoading(true)
    setError(null)
    try {
      const raw = await loadWishlist()
      setItems((raw || []).map(mapApiProductToPart))
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [useApi, user])

  useEffect(() => {
    if (!authHydrated) return
    if (!user) {
      openAuth()
      setLoading(false)
      return
    }
    if (!useApi) {
      setLoading(false)
      return
    }
    void reload()
  }, [authHydrated, user, useApi, openAuth, reload])

  const onToggle = async (partId) => {
    try {
      const data = await toggleWishlistProduct(partId)
      if (!data.inWishlist) {
        setItems((prev) => prev.filter((p) => p.id !== partId))
      }
    } catch {
      /* ignore */
    }
  }

  if (!authHydrated || !user) {
    return (
      <div className="min-h-svh bg-slate pt-[calc(var(--nav-h)+2rem)] text-center text-mist">
        <p className="font-sans text-sm">Sign in to see your favorites.</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-slate pt-[calc(var(--nav-h)+1rem)] pb-20">
      <img
        src={publicUrl('images/engine.jpg')}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15"
        loading="lazy"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-slate/85" aria-hidden />
      <div className="relative z-[1] mx-auto max-w-6xl px-4">
        <Link
          to="/catalog"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-hud transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Back to catalog
        </Link>
        <header className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">Saved</p>
          <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-wide text-fog">Favorites</h1>
          <p className="mt-2 font-sans text-sm text-mist">Parts you have hearted appear here.</p>
        </header>

        {loading ? (
          <p className="text-mist">Loading…</p>
        ) : error ? (
          <p className="text-flare">{error}</p>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-steel/60 bg-ink/80 p-8 text-center text-mist">
            No favorites yet.{' '}
            <Link to="/catalog" className="text-accent underline">
              Browse parts
            </Link>
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((part) => {
              const img = part.imageUrl ? { src: part.imageUrl, alt: part.name } : getPartImage(part.imageKey)
              return (
                <li
                  key={part.id}
                  className="ad-store-card overflow-hidden rounded-xl border border-steel/70 bg-ink/95 shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-slate">
                    <SafeImg
                      src={img.src}
                      alt={img.alt}
                      fw={800}
                      fh={600}
                      className="h-full w-full object-cover"
                      width={700}
                      height={525}
                      loading="lazy"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-steel/80 bg-ink/90 text-accent shadow-md backdrop-blur-sm"
                      aria-label="Remove from favorites"
                      onClick={() => void onToggle(part.id)}
                    >
                      <Heart className="h-4 w-4 fill-accent" strokeWidth={1.75} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="font-mono text-[10px] text-mist">{part.sku}</p>
                    <p className="mt-1 font-display text-sm font-bold uppercase text-fog">{part.name}</p>
                    <p className="mt-2 font-sans text-lg font-bold text-accent">{formatInr(part.price)}</p>
                    <Link
                      to="/"
                      className="mt-3 inline-block font-sans text-xs font-semibold text-accent hover:underline"
                      onClick={() => {
                        window.setTimeout(() => {
                          window.location.hash = `part=${encodeURIComponent(part.id)}`
                        }, 0)
                      }}
                    >
                      View on home
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
