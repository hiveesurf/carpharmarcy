import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'

const inputClass =
  'w-full rounded-xl border border-steel/80 bg-ink/40 px-3 py-2 text-sm text-fog focus:border-accent/50 focus:outline-none'

/**
 * @param {{ product: Record<string, unknown>, onClose: () => void, onUpdated: (updated: Record<string, unknown>) => void }} props
 */
export function AddStockModal({ product, onClose, onUpdated }) {
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const currentStock = Math.max(0, Math.floor(Number(product?.totalStock ?? 0)))
  const parsedQty = Math.floor(Number(quantity))
  const validQty = Number.isFinite(parsedQty) && parsedQty >= 1

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validQty || !product?.id) return
    setSaving(true)
    setErr(null)
    try {
      const updated = await adminService.addProductStock(String(product.id), parsedQty)
      if (updated) onUpdated(updated)
      onClose()
    } catch (error) {
      setErr(getFetchErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-steel/60 bg-slate shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-stock-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-steel/50 px-5 py-4">
          <h2 id="add-stock-title" className="font-display text-base font-bold tracking-tight text-fog">
            Add stock
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-steel/60 text-fog hover:bg-steel/30 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-mist">Product</p>
            <p className="mt-1 text-sm font-medium text-fog">{product?.name ?? '—'}</p>
            {product?.sku ? (
              <p className="mt-0.5 font-mono text-xs text-mist">{String(product.sku)}</p>
            ) : null}
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-mist">Current stock</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-fog">{currentStock}</p>
          </div>

          <div>
            <label htmlFor="add-stock-qty" className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
              Add quantity
            </label>
            <input
              id="add-stock-qty"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              required
              value={quantity}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '')
                setQuantity(v === '' ? '' : String(Math.max(1, parseInt(v, 10) || 0)))
              }}
              className={inputClass}
              autoFocus
            />
            {validQty ? (
              <p className="mt-1.5 text-xs text-mist">
                New stock after update: <span className="font-semibold text-fog">{currentStock + parsedQty}</span>
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-flare">Enter a positive whole number (minimum 1).</p>
            )}
          </div>

          {err ? (
            <div className="rounded-xl border border-flare/40 bg-flare-muted px-3 py-2 text-sm text-fog">{err}</div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-steel/40 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-steel/80 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !validQty}
              className="rounded-xl bg-accent px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-on-accent hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Updating…' : 'Update stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
