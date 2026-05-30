import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { formatInr } from '../../data/partsCatalog'
import { partDisplayImage } from '../../lib/productImage.js'
import { useCart } from '../../context/useCart'
import { useAuth } from '../../context/useAuth'
import { SafeImg } from '../ui/SafeImg'
import { Button } from '../ui/Button'
import { ApiSectionError } from '../ui/ApiSectionError'
import { apiV1Base } from '../../api/client.js'

export function CartDrawer() {
  const navigate = useNavigate()
  const { user, openAuth } = useAuth()
  const {
    drawerOpen,
    closeCart,
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
  const apiOn = Boolean(apiV1Base())

  function goToCheckout() {
    closeCart()
    if (!user) {
      openAuth()
      return
    }
    navigate('/checkout')
  }

  function goToCartPage() {
    closeCart()
    navigate('/cart')
  }

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-ink/70 backdrop-blur-sm"
            aria-label="Close cart overlay"
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 right-0 top-0 z-[90] flex w-full max-w-md flex-col border-l border-steel/70 bg-ink/95 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-steel/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-accent" strokeWidth={1.5} />
                <h2 id="cart-title" className="font-display text-lg font-bold uppercase tracking-wide text-fog">
                  Your cart
                </h2>
                {itemCount > 0 && (
                  <span className="font-mono text-xs text-hud">{itemCount} items</span>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="clip-chamfer-sm flex h-10 w-10 items-center justify-center border border-fog/15 text-fog hover:border-accent/40"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {apiOn && cartLoading && lineItems.length === 0 && !cartError ? (
                <p className="mt-8 text-center font-sans text-sm text-mist">Loading cart…</p>
              ) : null}
              {apiOn && cartError ? (
                <div className={lineItems.length > 0 ? 'mb-4' : 'mt-4'}>
                  <ApiSectionError
                    title="Cart could not load"
                    message={cartError}
                    onRetry={retryCart}
                    className="px-4 py-5"
                  />
                </div>
              ) : null}
              {lineItems.length > 0 ? (
                <ul className="space-y-4">
                  {lineItems.map(({ part, qty, lineTotal }) => {
                    const img = partDisplayImage(part)
                    return (
                      <li
                        key={part.id}
                        className="ad-store-card flex gap-4 border border-steel/70 bg-slate/60 p-3 clip-chamfer-sm"
                      >
                        <SafeImg
                          src={img.src}
                          alt=""
                          fw={200}
                          fh={160}
                          className="h-20 w-24 shrink-0 object-cover"
                          width={96}
                          height={80}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-bold uppercase leading-tight text-fog">
                            {part.name}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-mist">{part.sku}</p>
                          <p className="mt-1 font-mono text-sm text-accent">{formatInr(lineTotal)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPartQty(part.id, qty - 1)}
                              className="flex h-8 w-8 items-center justify-center border border-fog/15 text-fog hover:border-accent/40"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-mono text-sm text-fog">{qty}</span>
                            <button
                              type="button"
                              onClick={() => setPartQty(part.id, qty + 1)}
                              disabled={qty >= part.totalStock}
                              className="flex h-8 w-8 items-center justify-center border border-fog/15 text-fog hover:border-accent/40 disabled:opacity-30"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(part.id)}
                              className="ml-auto flex h-8 w-8 items-center justify-center text-flare hover:text-flare/80"
                              aria-label="Remove line"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : !cartLoading && !cartError ? (
                <p className="mt-8 text-center font-sans text-mist">Cart is empty. Add parts from the catalog.</p>
              ) : null}
            </div>

            <div className="border-t border-steel/70 bg-slate/50 px-5 py-5">
              <div className="mb-4 flex items-center justify-between font-mono text-sm">
                <span className="text-mist">{apiOn ? 'Subtotal' : 'Subtotal (demo)'}</span>
                <span className="text-lg font-semibold text-accent">{formatInr(subtotal)}</span>
              </div>
              {apiOn ? (
                <>
                  {itemCount > 0 ? (
                    <p className="mb-4 text-center text-xs text-mist">
                      {user
                        ? 'Review address and payment on the checkout page.'
                        : 'Sign in to proceed to checkout. Your cart is saved on the server.'}
                    </p>
                  ) : null}
                  {itemCount > 0 ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="mb-2 w-full"
                      type="button"
                      onClick={() => (user ? goToCheckout() : openAuth())}
                    >
                      {user ? 'Proceed to checkout' : 'Sign in to checkout'}
                    </Button>
                  ) : null}
                  {itemCount > 0 ? (
                    <Button variant="secondary" size="md" className="mb-2 w-full" type="button" onClick={goToCartPage}>
                      View full cart
                    </Button>
                  ) : null}
                  {user ? (
                    <p className="mb-3 text-center">
                      <Link
                        to="/orders"
                        className="font-sans text-xs font-semibold text-accent hover:underline"
                        onClick={closeCart}
                      >
                        View my orders
                      </Link>
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mb-4 text-center text-xs text-mist">
                  No payment — frontend demo only. Inventory updates as you change the cart.
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" size="md" className="flex-1" type="button" onClick={clearCart}>
                  Clear cart
                </Button>
                <Button variant="primary" size="md" className="flex-1" type="button" onClick={closeCart}>
                  Continue shopping
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
