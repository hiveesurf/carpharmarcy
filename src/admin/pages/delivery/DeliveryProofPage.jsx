import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Camera, RotateCcw } from 'lucide-react'
import { useDeliveryOrder } from '../../hooks/useDeliveryOrder.js'
import { useDeliveryWorkflow } from '../../hooks/useDeliveryWorkflow.js'
import { DeliveryPaymentDisplay } from '../../components/delivery/DeliveryPaymentDisplay.jsx'
import {
  DeliveryPageError,
  DeliveryPageLoading,
  DeliveryPageShell,
  DeliveryPanelSection,
} from '../../components/delivery/DeliveryPageShell.jsx'
import { deriveDeliveryUiStage } from '../../../lib/deliveryUiStage.js'
import { deliveryDetailPath, deliverySuccessPath } from '../../../lib/deliveryRoutes.js'
import {
  DELIVERY_LINK,
  DELIVERY_PRIMARY_BTN,
  DELIVERY_SECONDARY_BTN,
} from '../../components/delivery/deliveryTheme.js'

export function DeliveryProofPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { order, setOrder, loading, error } = useDeliveryOrder(orderId)
  const [actionError, setActionError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const proofInputRef = useRef(null)

  const workflow = useDeliveryWorkflow({
    order,
    onUpdated: (updated) => {
      setOrder(updated)
      if (updated?.proofPhotoUrl) {
        navigate(deliveryDetailPath(orderId), { replace: true })
      }
    },
    onError: setActionError,
    onBusy: setBusyId,
    busyId,
  })

  const { busy, uploadProof, reached } = workflow

  useEffect(() => {
    if (!order || loading) return
    const stage = deriveDeliveryUiStage(order, { reached })
    if (stage === 'delivered') {
      navigate(deliverySuccessPath(orderId), { replace: true })
      return
    }
    if (stage !== 'proof' && stage !== 'ready_deliver') {
      navigate(deliveryDetailPath(orderId), { replace: true })
    }
  }, [order, loading, orderId, navigate, reached])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const onFile = (file) => {
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    void uploadProof(file)
  }

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    proofInputRef.current?.click()
  }

  if (loading) return <DeliveryPageLoading />
  if (error) return <DeliveryPageError message={error} backTo={deliveryDetailPath(orderId)} backLabel="Back to order" />
  if (!order) return <DeliveryPageError message="Order not found." />

  const hasServerProof = Boolean(order.proofPhotoUrl)

  return (
    <DeliveryPageShell>
      <header className="border-b border-[#e7e7e7] pb-2.5">
        <Link to={deliveryDetailPath(orderId)} className={DELIVERY_LINK}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to order
        </Link>
        <h1 className="mt-2 font-display text-xl font-bold text-[#0f1111]">Upload delivery proof</h1>
        <p className="mt-1 text-sm text-[#565959]">Photo at the doorstep — you will not see it after upload.</p>
      </header>

      {actionError ? (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {actionError}
        </div>
      ) : null}

      <DeliveryPanelSection>
        <DeliveryPaymentDisplay order={order} layout="inline" />
      </DeliveryPanelSection>

      <DeliveryPanelSection>
        {previewUrl ? (
          <div className="overflow-hidden rounded-lg border border-[#d5d9d9] bg-[#fafafa]">
            <img src={previewUrl} alt="Proof preview" className="max-h-[min(36vh,280px)] w-full object-cover" />
          </div>
        ) : (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d5d9d9] bg-[#fafafa] p-5">
            <Camera className="h-10 w-10 text-[#888c8c]" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-[#0f1111]">Camera or gallery</p>
            <p className="text-xs text-[#565959]">JPEG, PNG or WebP · max 5 MB</p>
          </div>
        )}

        <input
          ref={proofInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) onFile(file)
          }}
        />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:max-w-md">
          {previewUrl || hasServerProof ? (
            <button type="button" className={DELIVERY_SECONDARY_BTN} disabled={busy} onClick={retake}>
              <RotateCcw className="h-4 w-4 text-flare" aria-hidden />
              Retake
            </button>
          ) : null}
          <button
            type="button"
            className={DELIVERY_PRIMARY_BTN}
            disabled={busy}
            onClick={() => proofInputRef.current?.click()}
          >
            {busy ? 'Uploading…' : previewUrl || hasServerProof ? 'Upload again' : 'Upload proof'}
          </button>
        </div>

        {(previewUrl || hasServerProof) && !busy ? (
          <p className="mt-2 text-center text-xs text-[#067d62]">Saved. Return to order to mark delivered.</p>
        ) : null}
      </DeliveryPanelSection>
    </DeliveryPageShell>
  )
}
