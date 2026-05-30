import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatInr } from '../../data/partsCatalog'
import { partDisplayImage } from '../../lib/productImage.js'
import { SafeImg } from '../ui/SafeImg'

/**
 * @param {{ part: object, qty: number, lineTotal: number, onDecrease?: () => void, onIncrease?: () => void, onRemove?: () => void, maxStock?: number, compact?: boolean, readOnly?: boolean }} props
 */
export function CartLineRow({
  part,
  qty,
  lineTotal,
  onDecrease,
  onIncrease,
  onRemove,
  maxStock = 99,
  compact = false,
  readOnly = false,
}) {
  const img = partDisplayImage(part)
  const imgClass = compact ? 'h-16 w-20' : 'h-20 w-24'

  return (
    <li className="ad-store-card flex gap-4 border border-steel/70 bg-slate/60 p-3 clip-chamfer-sm sm:p-4">
      <SafeImg
        src={img.src}
        alt=""
        fw={200}
        fh={160}
        className={`${imgClass} shrink-0 object-cover`}
        width={96}
        height={80}
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold uppercase leading-tight text-fog sm:text-base">{part.name}</p>
        <p className="mt-1 font-mono text-[10px] text-mist">SKU {part.sku}</p>
        <p className="mt-1 font-mono text-xs text-mist">
          {formatInr(part.price)} each
        </p>
        <p className="mt-1 font-mono text-sm font-semibold text-accent">{formatInr(lineTotal)}</p>
        {readOnly ? (
          <p className="mt-2 font-mono text-xs text-mist">Qty {qty}</p>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onDecrease}
              className="flex h-8 w-8 items-center justify-center border border-fog/15 text-fog hover:border-accent/40"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center font-mono text-sm text-fog">{qty}</span>
            <button
              type="button"
              onClick={onIncrease}
              disabled={qty >= maxStock}
              className="flex h-8 w-8 items-center justify-center border border-fog/15 text-fog hover:border-accent/40 disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 font-sans text-xs text-flare hover:bg-flare/10"
              aria-label="Remove item"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
