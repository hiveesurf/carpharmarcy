import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { formatInr } from '../data/partsCatalog'
import { useCart } from '../context/useCart'
import { useAuth } from '../context/useAuth'
import { apiV1Base } from '../api/client.js'
import { Button } from '../components/ui/Button'
import { ApiSectionError } from '../components/ui/ApiSectionError'
import { CartLineRow } from '../components/cart/CartLineRow'

export function CartPage() {
  const apiOn = Boolean(apiV1Base())
  const { user, openAuth } = useAuth()
  const {
    lineItems,
    itemCount,
    subtotal,
    setPartQty,
    removeFromCart,
    clearCart,
    cartError,
    cartLoading,
    retryCart,
  } = useCart()

  return (
    <div className="relative min-h-svh overflow-hidden bg-slate pt-[calc(var(--nav-h)+1rem)] pb-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-slate" aria-hidden />
      <div className="relative z-[1] mx-auto max-w-3xl px-4">
        <Link
          to="/catalog"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-hud transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Continue shopping
        </Link>

        <header className="mb-8 flex items-center gap-3">
          <ShoppingBag className="h-7 w-7 text-accent" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-hud">Your cart</p>
            <h1 className="font-display text-3xl font-black uppercase tracking-wide text-fog">Cart</h1>
            {itemCount > 0 ? (
              <p className="mt-1 font-sans text-sm text-mist">
                {itemCount} item{itemCount === 1 ? '' : 's'} in your cart
              </p>
            ) : null}
          </div>
        </header>

        {!apiOn ? (
          <div className="rounded-2xl border border-steel/70 bg-ink/95 p-8 text-center shadow-lg backdrop-blur-sm">
            <p className="font-sans text-sm text-mist">
              Cart checkout requires the API. Browse the catalog in demo mode or connect the backend.
            </p>
            <Link to="/catalog" className="mt-4 inline-block font-sans text-sm font-semibold text-accent hover:underline">
              Browse catalog
            </Link>
          </div>
        ) : null}

        {apiOn && cartLoading && lineItems.length === 0 && !cartError ? (
          <p className="font-sans text-sm text-mist">Loading cart…</p>
        ) : null}

        {apiOn && cartError ? (
          <ApiSectionError title="Cart could not load" message={cartError} onRetry={retryCart} className="mb-6" />
        ) : null}

        {apiOn && !cartLoading && lineItems.length === 0 && !cartError ? (
          <div className="rounded-2xl border border-steel/70 bg-ink/95 p-10 text-center shadow-lg backdrop-blur-sm">
            <ShoppingBag className="mx-auto h-12 w-12 text-mist" strokeWidth={1.25} />
            <p className="mt-4 font-sans text-fog">Your cart is empty.</p>
            <Link
              to="/catalog"
              className="mt-4 inline-block font-sans text-sm font-semibold text-accent hover:underline"
            >
              Browse parts
            </Link>
          </div>
        ) : null}

        {lineItems.length > 0 ? (
          <>
            <ul className="space-y-4">
              {lineItems.map(({ part, qty, lineTotal }) => (
                <CartLineRow
                  key={part.id}
                  part={part}
                  qty={qty}
                  lineTotal={lineTotal}
                  maxStock={part.totalStock}
                  onDecrease={() => setPartQty(part.id, qty - 1)}
                  onIncrease={() => setPartQty(part.id, qty + 1)}
                  onRemove={() => removeFromCart(part.id)}
                />
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-steel/70 bg-ink/95 p-6 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between font-mono text-sm">
                <span className="text-mist">Subtotal</span>
                <span className="text-2xl font-semibold text-accent">{formatInr(subtotal)}</span>
              </div>
              <p className="mt-2 text-center font-sans text-xs text-mist">
                Taxes and delivery charges may apply at checkout.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" size="md" className="flex-1" type="button" onClick={() => clearCart()}>
                  Clear cart
                </Button>
                {user ? (
                  <Link to="/checkout" className="flex-1">
                    <Button variant="primary" size="md" className="w-full" type="button">
                      Proceed to checkout
                    </Button>
                  </Link>
                ) : (
                  <Button variant="primary" size="md" className="flex-1" type="button" onClick={() => openAuth()}>
                    Sign in to checkout
                  </Button>
                )}
              </div>
              <Link
                to="/catalog"
                className="mt-4 block text-center font-sans text-xs font-semibold text-accent hover:underline"
              >
                Continue shopping
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
