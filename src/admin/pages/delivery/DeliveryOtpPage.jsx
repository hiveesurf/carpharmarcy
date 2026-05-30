import { useEffect, useRef, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router-dom'

import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, MapPin } from 'lucide-react'

import { useDeliveryOrder } from '../../hooks/useDeliveryOrder.js'

import { useDeliveryWorkflow } from '../../hooks/useDeliveryWorkflow.js'

import { DeliveryContactActions } from '../../components/delivery/DeliveryContactActions.jsx'

import { DeliveryPaymentDisplay } from '../../components/delivery/DeliveryPaymentDisplay.jsx'

import {

  DeliveryPageError,

  DeliveryPageLoading,

  DeliveryPageShell,

  DeliveryPanelSection,

} from '../../components/delivery/DeliveryPageShell.jsx'

import {

  formatDeliveryAddress,

  deriveDeliveryUiStage,

  isDeliveryOtpStep,

} from '../../../lib/deliveryUiStage.js'

import { deliveryDetailPath, deliveryProofPath } from '../../../lib/deliveryRoutes.js'

import { DELIVERY_LINK, DELIVERY_PRIMARY_BTN } from '../../components/delivery/deliveryTheme.js'



const RESEND_COOLDOWN_SEC = 30

const OTP_LEN = 6



function OtpDigitBoxes({ value, onChange, disabled }) {

  const refs = useRef([])

  const digits = Array.from({ length: OTP_LEN }, (_, i) => value[i] ?? '')



  const setAt = (index, char) => {

    const next = digits.slice()

    next[index] = char

    onChange(next.join('').replace(/\D/g, '').slice(0, OTP_LEN))

  }



  return (

    <div className="flex justify-center gap-2" role="group" aria-label="6-digit OTP">

      {digits.map((d, i) => (

        <input

          key={i}

          ref={(el) => {

            refs.current[i] = el

          }}

          type="text"

          inputMode="numeric"

          autoComplete={i === 0 ? 'one-time-code' : 'off'}

          maxLength={1}

          value={d}

          disabled={disabled}

          aria-label={`Digit ${i + 1}`}

          className="h-12 w-10 rounded-lg border-2 border-[#d5d9d9] bg-white text-center font-mono text-xl font-bold text-[#0f1111] outline-none focus:border-flare focus:ring-2 focus:ring-flare/25 disabled:opacity-50 sm:h-14 sm:w-11"

          onChange={(e) => {

            const c = e.target.value.replace(/\D/g, '').slice(-1)

            setAt(i, c)

            if (c && i < OTP_LEN - 1) refs.current[i + 1]?.focus()

          }}

          onKeyDown={(e) => {

            if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()

          }}

          onPaste={(e) => {

            e.preventDefault()

            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)

            if (!pasted) return

            onChange(pasted)

            refs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus()

          }}

        />

      ))}

    </div>

  )

}



export function DeliveryOtpPage() {

  const { orderId } = useParams()

  const navigate = useNavigate()

  const { order, setOrder, loading, error } = useDeliveryOrder(orderId)

  const [actionError, setActionError] = useState(null)

  const [busyId, setBusyId] = useState(null)

  const [cooldown, setCooldown] = useState(0)



  const workflow = useDeliveryWorkflow({

    order,

    onUpdated: (updated) => {
      setOrder(updated)
      if (updated?.deliveryOtpVerified) {
        navigate(deliveryProofPath(orderId), { replace: true })
      }
    },

    onError: setActionError,

    onBusy: setBusyId,

    busyId,

  })



  const { otpInput, setOtpInput, busy, run, tel, wa, maps, resendSuccess, reached } = workflow



  const otpVerified = Boolean(order?.deliveryOtpVerified)



  useEffect(() => {

    if (!order || loading) return



    if (otpVerified) return



    const uiStage = deriveDeliveryUiStage(order, { reached })

    if (uiStage === 'proof' || uiStage === 'ready_deliver') {

      navigate(deliveryProofPath(orderId), { replace: true })

      return

    }



    if (!isDeliveryOtpStep(order, { reached })) {

      navigate(deliveryDetailPath(orderId), { replace: true })

    }

  }, [order, loading, orderId, navigate, reached, otpVerified])



  useEffect(() => {

    if (cooldown <= 0) return undefined

    const id = window.setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)

    return () => window.clearInterval(id)

  }, [cooldown])



  const handleResend = async () => {

    if (cooldown > 0 || busy) return

    await run('resend')

    setCooldown(RESEND_COOLDOWN_SEC)

  }



  if (loading) return <DeliveryPageLoading />

  if (error) return <DeliveryPageError message={error} backTo={deliveryDetailPath(orderId)} backLabel="Back to order" />

  if (!order) return <DeliveryPageError message="Order not found." />



  const customerName = order.customerName?.trim() || 'Customer'

  const address = formatDeliveryAddress(order.shippingAddress)



  if (otpVerified) {

    return (

      <DeliveryPageShell>

        <header className="border-b border-[#e7e7e7] pb-2.5 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">

            <CheckCircle2 className="h-8 w-8" aria-hidden />

          </div>

          <h1 className="mt-3 font-display text-xl font-bold text-[#0f1111]">OTP already verified</h1>

          <p className="mt-1 text-sm text-[#565959]">Continue with proof of delivery upload.</p>

        </header>

        <button

          type="button"

          className={`${DELIVERY_PRIMARY_BTN} mx-auto max-w-md`}

          onClick={() => navigate(deliveryProofPath(orderId))}

        >

          Continue to proof upload

        </button>

        <Link to={deliveryDetailPath(orderId)} className={`${DELIVERY_LINK} mx-auto`}>

          <ArrowLeft className="h-4 w-4" aria-hidden />

          Back to order

        </Link>

      </DeliveryPageShell>

    )

  }



  return (

    <DeliveryPageShell>

      <header className="border-b border-[#e7e7e7] pb-2.5">

        <Link to={deliveryDetailPath(orderId)} className={DELIVERY_LINK}>

          <ArrowLeft className="h-4 w-4" aria-hidden />

          Back to order

        </Link>

        <h1 className="mt-2 font-display text-xl font-bold text-[#0f1111]">Enter customer OTP</h1>

        <p className="font-mono text-xs text-[#565959]">{order.id}</p>

      </header>



      {actionError ? (

        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">

          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />

          {actionError}

        </div>

      ) : null}



      <DeliveryPanelSection>

        <p className="text-sm font-semibold text-[#0f1111]">{customerName}</p>

        {order.customerPhone ? <p className="mt-0.5 font-mono text-sm text-[#565959]">{order.customerPhone}</p> : null}

        <p className="mt-1 flex gap-1.5 text-sm text-[#565959]">

          <MapPin className="h-3.5 w-3.5 shrink-0 text-flare" aria-hidden />

          {address}

        </p>

        <div className="mt-2 border-t border-[#e7e7e7] pt-2">

          <DeliveryPaymentDisplay order={order} layout="inline" />

        </div>

        <div className="mt-2">

          <DeliveryContactActions tel={tel} wa={wa} maps={maps} labels="full" />

        </div>

      </DeliveryPanelSection>



      <DeliveryPanelSection className="text-center">

        <OtpDigitBoxes value={otpInput} onChange={setOtpInput} disabled={busy} />

        <p className="mt-3 text-sm text-[#565959]">Ask the customer for their 6-digit delivery code.</p>

        {cooldown > 0 ? (

          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-[#565959]" aria-live="polite">

            <Clock className="h-4 w-4 text-flare" aria-hidden />

            Resend in <span className="font-semibold text-flare">{cooldown}s</span>

          </p>

        ) : (

          <button

            type="button"

            className="mt-2 text-sm font-semibold text-flare underline-offset-2 hover:underline disabled:opacity-50"

            disabled={busy}

            onClick={() => void handleResend()}

          >

            {busy ? 'Sending…' : 'Resend OTP'}

          </button>

        )}

        {resendSuccess ? (

          <p className="mt-1 text-sm font-medium text-[#067d62]">New OTP sent to customer.</p>

        ) : null}

        <button

          type="button"

          className={`${DELIVERY_PRIMARY_BTN} mx-auto mt-4 max-w-md`}

          disabled={busy || otpInput.length !== OTP_LEN}

          onClick={() => void run('verify')}

        >

          {busy ? 'Verifying…' : 'Verify OTP'}

        </button>

      </DeliveryPanelSection>

    </DeliveryPageShell>

  )

}

