import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { augmentPart, getPartById } from '../data/partsCatalog'
import { apiV1Base } from '../api/client.js'
import { fetchProductById } from '../services/productService.js'
import { mapApiProductToPart } from '../lib/mapApiProduct.js'
import { getFetchErrorMessage } from '../lib/apiErrorMessage.js'
import { ApiSectionError } from '../components/ui/ApiSectionError'
import { PartDetailContent } from '../components/parts/PartDetailContent.jsx'

export function PartsProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const useApi = Boolean(apiV1Base())

  const backTo = useMemo(() => {
    const from = location.state?.from
    if (typeof from === 'string' && from.startsWith('/')) return from
    return '/catalog'
  }, [location.state])

  const [rawPart, setRawPart] = useState(null)
  const [loading, setLoading] = useState(Boolean(useApi && productId))
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const load = useCallback(async () => {
    if (!productId) return
    if (!useApi) {
      const local = getPartById(productId)
      setRawPart(local ?? null)
      setLoading(false)
      setError(local ? null : 'Product not found')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const api = await fetchProductById(productId)
      if (!api) {
        setRawPart(null)
        setError('Product not found')
      } else {
        setRawPart(mapApiProductToPart(api))
      }
    } catch (e) {
      setRawPart(null)
      setError(getFetchErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [productId, useApi])

  useEffect(() => {
    void load()
  }, [load, retryKey])

  const part = rawPart ? augmentPart(rawPart) : null

  return (
    <div className="relative min-h-svh overflow-hidden bg-slate pt-[calc(var(--nav-h)+1rem)] pb-16">
      <div className="relative z-[1] mx-auto max-w-7xl px-4 lg:px-6">
        <Link
          to={backTo}
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-hud transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Back to catalog
        </Link>

        {loading ? (
          <p className="py-16 text-center font-sans text-sm text-mist">Loading product…</p>
        ) : error ? (
          <ApiSectionError
            title="Could not load this product"
            message={error}
            onRetry={() => setRetryKey((k) => k + 1)}
            className="max-w-lg"
          />
        ) : part ? (
          <PartDetailContent part={part} />
        ) : (
          <div className="py-16 text-center">
            <p className="font-sans text-mist">Product not found.</p>
            <button
              type="button"
              onClick={() => navigate('/catalog')}
              className="mt-4 font-sans text-sm font-semibold text-accent hover:underline"
            >
              Return to marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
