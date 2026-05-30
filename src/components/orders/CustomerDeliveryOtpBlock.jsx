import { useCallback, useEffect, useState } from 'react'
import * as orderService from '../../services/orderService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { normalizeDeliveryStage } from '../../lib/deliveryStage.js'

function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function isOtpStage(stage) {
  const s = normalizeDeliveryStage(stage)
  return s === 'otp_pending' || s === 'out_for_delivery'
}

/**
 * Live delivery OTP from GET /orders/{id}/delivery-otp (not list cache).
 */
export function CustomerDeliveryOtpBlock({ orderId, deliveryStage, deliveryOtpVerified, active }) {
  const [otpState, setOtpState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(null)

  const fetchOtp = useCallback(async () => {
    if (!orderId || !active || !isOtpStage(deliveryStage) || deliveryOtpVerified) {
      return null
    }
    setLoading(true)
    setError(null)
    try {
      const data = await orderService.getDeliveryOtp(orderId)
      setOtpState(data)
      return data
    } catch (e) {
      setError(getFetchErrorMessage(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [orderId, deliveryStage, deliveryOtpVerified, active])

  useEffect(() => {
    if (!active || !isOtpStage(deliveryStage) || deliveryOtpVerified) {
      setOtpState(null)
      setError(null)
      return
    }
    void fetchOtp()
  }, [active, deliveryStage, deliveryOtpVerified, fetchOtp])

  useEffect(() => {
    if (!otpState?.otpExpiresAt || otpState?.otpExpired) {
      setSecondsLeft(null)
      return undefined
    }
    const tick = () => {
      const end = new Date(otpState.otpExpiresAt).getTime()
      const left = Math.ceil((end - Date.now()) / 1000)
      setSecondsLeft(left)
      if (left <= 0) {
        setOtpState((prev) =>
          prev
            ? {
                ...prev,
                deliveryOtp: null,
                otpPending: false,
                otpExpired: true,
                message:
                  'Delivery OTP expired. Ask delivery partner to resend OTP.',
              }
            : prev,
        )
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [otpState?.otpExpiresAt, otpState?.otpExpired])

  if (!active || !isOtpStage(deliveryStage)) {
    return null
  }

  if (deliveryOtpVerified) {
    return <p className="mt-2 text-xs text-mist">Delivery OTP verified.</p>
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Delivery OTP</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => void fetchOtp()}
          className="font-sans text-[11px] font-semibold text-accent hover:underline disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh OTP'}
        </button>
      </div>

      {error ? <p className="text-xs text-flare">{error}</p> : null}

      {loading && !otpState ? (
        <p className="text-xs text-mist">Loading delivery OTP…</p>
      ) : null}

      {otpState?.deliveryOtp ? (
        <div
          className="rounded-xl border-2 border-accent/50 bg-accent/15 px-4 py-4 shadow-[0_0_24px_rgba(0,200,180,0.12)]"
          role="status"
          aria-live="polite"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
            Your delivery OTP
          </p>
          <p className="mt-3 font-display text-4xl font-bold tracking-[0.4em] text-fog tabular-nums">
            {otpState.deliveryOtp}
          </p>
          {secondsLeft != null && secondsLeft > 0 ? (
            <p className="mt-2 font-mono text-xs text-mist">
              Expires in <span className="font-semibold text-fog">{formatCountdown(secondsLeft)}</span>
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed text-mist">
            Share this 6-digit code with your delivery partner when they arrive. Do not share it on calls or
            messages with anyone else.
          </p>
        </div>
      ) : null}

      {otpState?.otpExpired ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-mist">
          <p className="font-semibold text-amber-100/90">OTP expired</p>
          <p className="mt-1 text-xs leading-relaxed">
            {otpState.message ||
              'Delivery OTP expired. Ask delivery partner to resend OTP.'}
          </p>
        </div>
      ) : null}

      {!loading && otpState && !otpState.deliveryOtp && !otpState.otpExpired ? (
        <p className="text-xs text-mist">
          OTP is not available yet. Tap Refresh OTP or wait for your delivery partner to start delivery.
        </p>
      ) : null}
    </div>
  )
}
