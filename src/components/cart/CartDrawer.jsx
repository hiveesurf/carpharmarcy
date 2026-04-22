import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { formatInr, getPartImage } from '../../data/partsCatalog'
import { useCart } from '../../context/useCart'
import { useAuth } from '../../context/useAuth'
import { SafeImg } from '../ui/SafeImg'
import { Button } from '../ui/Button'
import { ApiSectionError } from '../ui/ApiSectionError'
import { apiV1Base } from '../../api/client.js'
import { loadAddresses } from '../../services/userService.js'
import * as orderService from '../../services/orderService.js'
import * as paymentService from '../../services/paymentService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'

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
    refreshCart,
  } = useCart()
  const apiOn = Boolean(apiV1Base())
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const [razorpayBusy, setRazorpayBusy] = useState(false)

  async function ensureRazorpayScript() {
    if (window.Razorpay) return true
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-razorpay-checkout="1"]')
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')), {
          once: true,
        })
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.dataset.razorpayCheckout = '1'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })
    return Boolean(window.Razorpay)
  }

  async function openRazorpayCheckout(order) {
    const init = await paymentService.initiatePayment({ orderId: order.id })
    const sdkReady = await ensureRazorpayScript()
    if (!sdkReady || !window.Razorpay) throw new Error('Razorpay SDK not available')
    await new Promise((resolve, reject) => {
      const rz = new window.Razorpay({
        key: init.keyId,
        amount: init.amount,
        currency: init.currency || 'INR',
        name: 'Carnalysys',
        description: `Order ${order.id}`,
        order_id: init.razorpayOrderId,
        prefill: {
          name: user?.displayName || '',
          contact: user?.phone || user?.phoneE164 || '',
          email: user?.email || '',
        },
        notes: {
          order_id: order.id,
          transaction_id: init.transactionId,
        },
        handler: async (response) => {
          try {
            await paymentService.confirmPayment({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            resolve()
          } catch (err) {
            reject(err)
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      })
      rz.open()
    })
  }

  async function handlePlaceOrder() {
    if (!apiOn) return
    if (!user) {
      openAuth()
      return
    }
    if (itemCount <= 0) return
    setCheckoutBusy(true)
    setRazorpayBusy(true)
    setCheckoutError(null)
    let createdOrder = null
    try {
      let addressId
      try {
        const addrs = await loadAddresses()
        const list = Array.isArray(addrs) ? addrs : []
        const def = list.find((a) => a.isDefault) || list[0]
        if (def?.id) addressId = def.id
      } catch {
        /* shipping optional */
      }
      const order = await orderService.placeOrder({
        ...(addressId ? { addressId } : {}),
        paymentMethod: 'upi',
      })
      createdOrder = order
      await openRazorpayCheckout(order)
      await refreshCart?.()
      closeCart()
      navigate('/orders')
    } catch (e) {
      // Order is created before Razorpay opens. If payment then fails/cancels,
      // send the user home and let them check final payment state in Orders.
      if (createdOrder?.id) {
        closeCart()
        navigate('/', { replace: true })
        return
      }
      setCheckoutError(getFetchErrorMessage(e))
    } finally {
      setCheckoutBusy(false)
      setRazorpayBusy(false)
    }
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
                    const img = part.imageUrl
                      ? { src: part.imageUrl, alt: part.name }
                      : getPartImage(part.imageKey)
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
              {checkoutError ? (
                <p className="mb-3 rounded-lg border border-flare/40 bg-flare-muted px-3 py-2 text-center text-xs text-fog">
                  {checkoutError}
                </p>
              ) : null}
              {apiOn ? (
                <>
                  {user && itemCount > 0 ? (
                    <p className="mb-4 text-center text-xs text-mist">
                      Secure checkout via Razorpay. Your order is created first, then payment is captured.
                    </p>
                  ) : null}
                  {!user && itemCount > 0 ? (
                    <p className="mb-4 text-center text-xs text-mist">
                      Sign in to place an order. Your cart is kept on the server while you browse.
                    </p>
                  ) : null}
                  {user && itemCount > 0 ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="mb-2 w-full"
                      type="button"
                      disabled={checkoutBusy || razorpayBusy || cartLoading}
                      onClick={() => void handlePlaceOrder()}
                    >
                      {checkoutBusy || razorpayBusy ? 'Opening Razorpay…' : 'Pay with Razorpay'}
                    </Button>
                  ) : null}
                  {!user && itemCount > 0 ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="mb-2 w-full"
                      type="button"
                      onClick={() => openAuth()}
                    >
                      Sign in to place order
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
