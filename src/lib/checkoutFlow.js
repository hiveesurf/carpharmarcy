import * as orderService from '../services/orderService.js'
import * as paymentService from '../services/paymentService.js'

export async function ensureRazorpayScript() {
  if (typeof window !== 'undefined' && window.Razorpay) return true
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

/**
 * @param {{ order: { id: string }, user?: { displayName?: string, phone?: string, phoneE164?: string, email?: string } }} params
 */
export async function openRazorpayCheckout({ order, user }) {
  const init = await paymentService.initiatePayment({ orderId: order.id })
  const sdkReady = await ensureRazorpayScript()
  if (!sdkReady || !window.Razorpay) throw new Error('Razorpay SDK not available')
  await new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: init.keyId,
      amount: init.amount,
      currency: init.currency || 'INR',
      name: 'carpharmacy',
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

/**
 * @param {{ addressId: string, paymentMethod: string, user?: object, refreshCart?: () => Promise<void> }} params
 * @returns {Promise<{ order: object, requiresOnlinePayment: boolean }>}
 */
export async function placeOrderWithPayment({ addressId, paymentMethod, user, refreshCart }) {
  const order = await orderService.placeOrder({
    addressId,
    paymentMethod,
  })
  const paid =
    paymentMethod === 'cod' ||
    String(order?.paymentStatus || '').toLowerCase() === 'paid'
  try {
    if (!paid) {
      await openRazorpayCheckout({ order, user })
      const fresh = await orderService.getOrder(order.id)
      if (refreshCart) await refreshCart()
      return { order: fresh, requiresOnlinePayment: true }
    }
    if (refreshCart) await refreshCart()
    return { order, requiresOnlinePayment: false }
  } catch (err) {
    const wrapped = err instanceof Error ? err : new Error(String(err))
    wrapped.placedOrder = order
    throw wrapped
  }
}

export const PAYMENT_OPTIONS = [
  {
    id: 'upi',
    label: 'UPI / Razorpay',
    description: 'Pay securely online with UPI, card, or netbanking via Razorpay.',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay when your order is delivered. Subject to availability.',
  },
]
