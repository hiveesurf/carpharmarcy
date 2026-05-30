import { useCallback, useEffect, useMemo, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { deriveDeliveryUiStage } from '../../lib/deliveryUiStage.js'
import { telHref, whatsAppHref, googleMapsDirectionsHref } from '../../lib/deliveryLinks.js'

const MAX_PROOF_BYTES = 5 * 1024 * 1024
const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function reachedStorageKey(orderId) {
  return `carnalysys:delivery-reached:${orderId}`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

function validateProofFile(file) {
  if (!file) return 'No file selected'
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, or WebP images are allowed'
  }
  if (file.size > MAX_PROOF_BYTES) return 'Image must be 5 MB or smaller'
  return null
}

/**
 * @param {{
 *   order: object | null,
 *   onUpdated: (order: object) => void,
 *   onError: (msg: string | null) => void,
 *   onBusy: (id: string | null) => void,
 *   busyId: string | null,
 * }} params
 */
export function useDeliveryWorkflow({ order, onUpdated, onError, onBusy, busyId }) {
  const [otpInput, setOtpInput] = useState('')
  const [reached, setReached] = useState(false)
  const [failReason, setFailReason] = useState('customer_not_available')
  const [failNote, setFailNote] = useState('')
  const [showFailForm, setShowFailForm] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    setOtpInput('')
    setShowFailForm(false)
    setResendSuccess(false)
    if (!order?.id) {
      setReached(false)
      return
    }
    try {
      setReached(sessionStorage.getItem(reachedStorageKey(order.id)) === '1')
    } catch {
      setReached(false)
    }
  }, [order?.id])

  const uiStage = useMemo(
    () => (order ? deriveDeliveryUiStage(order, { reached }) : 'assigned'),
    [order, reached],
  )

  const phone = order?.customerPhone
  const tel = telHref(phone)
  const wa = whatsAppHref(phone, `Hi, I am your delivery partner for order ${order?.id}.`)
  const maps = googleMapsDirectionsHref(order?.shippingAddress)
  const busy = busyId === order?.id

  const run = useCallback(
    async (action) => {
      if (!order?.id) return
      onBusy(order.id)
      onError(null)
      try {
        let updated = null
        if (action === 'accept') updated = await adminService.deliveryAccept(order.id)
        else if (action === 'out') updated = await adminService.deliveryOutForDelivery(order.id)
        else if (action === 'resend') {
          updated = await adminService.deliveryResendOtp(order.id)
          setResendSuccess(true)
        } else if (action === 'verify') updated = await adminService.deliveryVerifyOtp(order.id, otpInput)
        else if (action === 'delivered') updated = await adminService.deliveryMarkDelivered(order.id)
        else if (action === 'failed') {
          updated = await adminService.deliveryMarkFailed(order.id, {
            reason: failReason,
            note: failNote,
          })
          setShowFailForm(false)
        }
        if (updated) onUpdated(updated)
        if (action === 'verify') setOtpInput('')
        window.dispatchEvent(new Event('carnalysys:delivery-stats-refresh'))
      } catch (e) {
        onError(getFetchErrorMessage(e))
      } finally {
        onBusy(null)
      }
    },
    [order?.id, otpInput, failReason, failNote, onBusy, onError, onUpdated],
  )

  const uploadProof = useCallback(
    async (file) => {
      if (!order?.id || !file) return
      const validationError = validateProofFile(file)
      if (validationError) {
        onError(validationError)
        return
      }
      onBusy(order.id)
      onError(null)
      try {
        const dataUrl = await readFileAsDataUrl(file)
        const updated = await adminService.deliveryUploadProof(order.id, dataUrl)
        if (updated) onUpdated(updated)
        window.dispatchEvent(new Event('carnalysys:delivery-stats-refresh'))
      } catch (e) {
        onError(getFetchErrorMessage(e))
      } finally {
        onBusy(null)
      }
    },
    [order?.id, onBusy, onError, onUpdated],
  )

  const confirmReached = useCallback(() => {
    if (order?.id) sessionStorage.setItem(reachedStorageKey(order.id), '1')
    setReached(true)
  }, [order?.id])

  return {
    uiStage,
    otpInput,
    setOtpInput,
    reached,
    confirmReached,
    failReason,
    setFailReason,
    failNote,
    setFailNote,
    showFailForm,
    setShowFailForm,
    resendSuccess,
    setResendSuccess,
    tel,
    wa,
    maps,
    busy,
    run,
    uploadProof,
  }
}
