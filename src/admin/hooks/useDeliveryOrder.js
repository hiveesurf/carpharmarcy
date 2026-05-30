import { useCallback, useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'

/**
 * Loads a single admin order for delivery workflow routes.
 * @param {string | undefined} orderId
 */
export function useDeliveryOrder(orderId) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!orderId) {
      setOrder(null)
      setLoading(false)
      setError('Order not found')
      return null
    }
    setLoading(true)
    setError(null)
    try {
      const o = await adminService.getAdminOrder(orderId)
      setOrder(o)
      return o
    } catch (e) {
      setError(getFetchErrorMessage(e))
      setOrder(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { order, setOrder, loading, error, reload }
}
