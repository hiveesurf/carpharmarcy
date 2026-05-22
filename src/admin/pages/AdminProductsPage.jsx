import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Eye,
  LayoutGrid,
  LayoutList,
  MoreVertical,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react'
import { AddStockModal } from '../components/AddStockModal.jsx'
import { ADMIN_LOW_STOCK_THRESHOLD, isAdminLowStock } from '../../lib/adminProductStock.js'
import { AddProductPanel } from '../components/AddProductPanel.jsx'
import { BulkImportProductsPanel } from '../components/BulkImportProductsPanel.jsx'
import { ProductEditDrawer } from '../components/ProductEditDrawer.jsx'
import { SaveSuccessNotice } from '../components/SaveSuccessNotice.jsx'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { SafeImg } from '../../components/ui/SafeImg.jsx'
import { useAuth } from '../../context/useAuth.js'
import { resolveApiAssetUrl } from '../../lib/resolveApiAssetUrl.js'

function formatInr(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n))
}

function clipDescription(text, max = 140) {
  if (!text || typeof text !== 'string') return ''
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

const PAGE_SIZE = 5
const SEARCH_DEBOUNCE_MS = 300
const ACTIONS_MENU_GAP = 6
const ACTIONS_MENU_EST_HEIGHT = 168
const ACTIONS_MENU_MIN_WIDTH = 168

const productActionTriggerClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-mist transition-colors hover:border-steel/60 hover:bg-steel/30'

const productActionMenuItemClass =
  'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-fog hover:bg-steel/30 disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Three-dot actions menu for a product row (portal avoids table overflow clipping).
 */
function ProductRowActions({
  product,
  open,
  onOpenChange,
  disabled,
  onAddStock,
  onEdit,
  onView,
  onDelete,
}) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [menuPos, setMenuPos] = useState(null)
  const label = product?.name || product?.sku || 'product'

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight ?? ACTIONS_MENU_EST_HEIGHT
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < menuHeight + ACTIONS_MENU_GAP + 12
    const top = openUpward ? rect.top - menuHeight - ACTIONS_MENU_GAP : rect.bottom + ACTIONS_MENU_GAP
    const right = Math.max(8, window.innerWidth - rect.right)
    setMenuPos({ top, right })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    updateMenuPosition()
    const raf = requestAnimationFrame(updateMenuPosition)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(ev) {
      const target = ev.target
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      onOpenChange(false)
    }
    function onKeyDown(ev) {
      if (ev.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: menuPos?.top ?? -9999,
              right: menuPos?.right ?? 8,
              minWidth: ACTIONS_MENU_MIN_WIDTH,
              zIndex: 200,
              visibility: menuPos ? 'visible' : 'hidden',
            }}
            className="overflow-hidden rounded-lg border border-steel/60 bg-slate py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={productActionMenuItemClass}
              onClick={() => {
                onOpenChange(false)
                onAddStock(product)
              }}
            >
              <PackagePlus className="h-4 w-4 shrink-0 text-mist" aria-hidden />
              Add Stock
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={productActionMenuItemClass}
              onClick={() => {
                onOpenChange(false)
                onEdit(product)
              }}
            >
              <Pencil className="h-4 w-4 shrink-0 text-mist" aria-hidden />
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={productActionMenuItemClass}
              onClick={() => {
                onOpenChange(false)
                onView(product)
              }}
            >
              <Eye className="h-4 w-4 shrink-0 text-mist" aria-hidden />
              View
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              className={`${productActionMenuItemClass} text-flare hover:bg-flare-muted/30`}
              onClick={() => {
                onOpenChange(false)
                onDelete(product)
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              Delete
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          onOpenChange(!open)
        }}
        className={`${productActionTriggerClass} ${open ? 'border-steel/60 bg-steel/30' : ''}`}
        aria-label={`Actions for ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {menu}
    </>
  )
}

const compactSearchClass =
  'h-9 w-full min-w-[10.5rem] max-w-[14rem] rounded-xl border border-steel/80 bg-ink/40 py-1.5 pl-8 pr-2.5 text-xs text-fog placeholder:text-mist focus:border-accent/50 focus:outline-none'

export function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { sessionRole } = useAuth()
  const canEditProducts = sessionRole === 'super_admin' || sessionRole === 'sales'
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [productSaveSuccess, setProductSaveSuccess] = useState(false)
  const [sort, setSort] = useState('created_desc')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [viewMode, setViewMode] = useState('list')
  const [openActionsProductId, setOpenActionsProductId] = useState(null)
  const [listRefresh, setListRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(() => searchParams.get('lowStock') === '1')
  const [lowStockCount, setLowStockCount] = useState(0)
  const [lowStockThreshold, setLowStockThreshold] = useState(ADMIN_LOW_STOCK_THRESHOLD)
  const [stockModalProduct, setStockModalProduct] = useState(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLowStockOnly(searchParams.get('lowStock') === '1')
  }, [searchParams])

  useEffect(() => {
    let c = false
    adminService
      .listCategories()
      .then((list) => {
        if (!c) setCategories(list)
      })
      .catch(() => {
        if (!c) setCategories([])
      })
    return () => {
      c = true
    }
  }, [])

  function mergeSavedProduct(updated) {
    if (!updated?.id) return
    if (updated.deleted || updated.deletedAt) {
      setItems((prev) => prev.filter((x) => x.id !== updated.id))
      return
    }
    setItems((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))
  }

  const load = useCallback(async (reset = true) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminService.listProductsPage({
        page: reset ? 0 : nextPage,
        pageSize: PAGE_SIZE,
        sort,
        search: debouncedSearch || undefined,
        lowStockOnly,
      })
      setLowStockCount(result.lowStockCount ?? 0)
      setLowStockThreshold(result.lowStockThreshold ?? ADMIN_LOW_STOCK_THRESHOLD)
      const activeItems = (result.items || []).filter((x) => !x?.deleted && !x?.deletedAt)
      if (reset) {
        setItems(activeItems)
      } else {
        setItems((prev) => [...prev, ...activeItems])
      }
      setHasMore(Boolean(result.hasMore))
      setNextPage(result.nextPage)
    } catch (e) {
      setError(getFetchErrorMessage(e))
      if (reset) setItems([])
      setHasMore(false)
      setNextPage(1)
    } finally {
      setLoading(false)
    }
  }, [nextPage, sort, listRefresh, debouncedSearch, lowStockOnly])

  function setLowStockFilter(next) {
    setLowStockOnly(next)
    setNextPage(1)
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next) p.set('lowStock', '1')
        else p.delete('lowStock')
        return p
      },
      { replace: true },
    )
  }

  useEffect(() => {
    load(true)
  }, [load])

  function bumpList() {
    setListRefresh((n) => n + 1)
  }

  async function togglePublish(p) {
    if (p.deleted) return
    const next = !p.published
    setBusyId(p.id)
    try {
      const updated = await adminService.publishProduct(p.id, next)
      if (updated) {
        mergeSavedProduct(updated)
      } else {
        bumpList()
      }
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  async function remove(p) {
    if (p.deleted) return
    if (!window.confirm(`Delete product “${p.name}” (${p.id})?`)) return
    setBusyId(p.id)
    try {
      await adminService.removeProduct(p.id)
      bumpList()
    } catch (e) {
      setError(getFetchErrorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  function onProductCreated() {
    bumpList()
  }

  function onStockUpdated(updated) {
    mergeSavedProduct(updated)
    bumpList()
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      await load(false)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-6">
      {!canEditProducts ? (
        <div className="rounded-xl border border-steel/50 bg-slate/40 px-4 py-5 text-sm text-mist">
          Your role does not have access to product management.
        </div>
      ) : null}
      {canEditProducts ? (
      <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-fog md:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-mist">
            Manage pricing, stock, vehicle fitment, and profitability by product.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative shrink-0">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU, brand..."
              aria-label="Search products"
              className={compactSearchClass}
              autoComplete="off"
            />
          </div>
          <div className="inline-flex rounded-xl border border-steel/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-steel/50 text-accent'
                  : 'text-mist hover:text-fog'
              }`}
              title="List view"
            >
              <LayoutList className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === 'card'
                  ? 'bg-steel/50 text-accent'
                  : 'text-mist hover:text-fog'
              }`}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockOnly)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              lowStockOnly
                ? 'border-flare/50 bg-flare-muted text-flare'
                : 'border-steel/80 text-mist hover:border-flare/40 hover:text-flare'
            }`}
            aria-pressed={lowStockOnly}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            Low stock
            {lowStockCount > 0 ? (
              <span className="rounded-full bg-flare/20 px-1.5 py-0.5 tabular-nums">{lowStockCount}</span>
            ) : null}
          </button>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setNextPage(1)
              bumpList()
            }}
            className="rounded-xl border border-steel/80 bg-ink/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-fog focus:border-accent/50 focus:outline-none"
          >
            <option value="created_desc">Newest created</option>
            <option value="updated_desc">Recently updated</option>
          </select>
          <button
            type="button"
            onClick={() => bumpList()}
            disabled={loading || loadingMore}
            className="rounded-xl border border-steel/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mist transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh list
          </button>
        </div>
      </div>

      <AddProductPanel onCreated={onProductCreated} /> 

      <BulkImportProductsPanel onCompleted={bumpList} />

      {lowStockCount > 0 ? (
        <div
          className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
            lowStockOnly ? 'border-flare/50 bg-flare-muted/80' : 'border-flare/35 bg-flare-muted/50'
          }`}
          role="status"
        >
          <p className="flex items-start gap-2 text-sm text-fog">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-flare" strokeWidth={1.75} aria-hidden />
            <span>
              <span className="font-medium text-flare">Low stock:</span>{' '}
              {lowStockCount} product{lowStockCount === 1 ? '' : 's'} at or below {lowStockThreshold} units in
              inventory.
            </span>
          </p>
          {!lowStockOnly ? (
            <button
              type="button"
              onClick={() => setLowStockFilter(true)}
              className="shrink-0 self-start rounded-lg border border-flare/40 bg-ink/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-flare transition-colors hover:bg-flare-muted sm:self-center"
            >
              View low stock
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLowStockFilter(false)}
              className="shrink-0 self-start rounded-lg border border-steel/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mist transition-colors hover:border-accent/50 hover:text-accent sm:self-center"
            >
              Show all products
            </button>
          )}
        </div>
      ) : null}

      {debouncedSearch ? (
        <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
          Showing {items.length} match{items.length === 1 ? '' : 'es'} for &ldquo;{debouncedSearch}&rdquo;
        </p>
      ) : null}

      {lowStockOnly && !debouncedSearch ? (
        <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
          Filter: low stock only (≤ {lowStockThreshold} units)
        </p>
      ) : null}

      {error && (
        <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">
          {error}
        </div>
      )}

      {editingId && (
        <ProductEditDrawer
          productId={editingId}
          categories={categories}
          onClose={() => setEditingId(null)}
          onSaved={(updated, opts) => {
            mergeSavedProduct(updated)
            if (opts?.formSave) setProductSaveSuccess(true)
          }}
        />
      )}

      <SaveSuccessNotice open={productSaveSuccess} onDismiss={() => setProductSaveSuccess(false)} />

      {stockModalProduct ? (
        <AddStockModal
          product={stockModalProduct}
          onClose={() => setStockModalProduct(null)}
          onUpdated={onStockUpdated}
        />
      ) : null}

      {loading ? (
        <p className="font-mono text-xs text-mist">Loading products…</p>
      ) : viewMode === 'list' ? (
        <>
          <div className="admin-card overflow-visible">
            <div className="overflow-x-auto overflow-y-visible pb-1">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-steel/50 font-mono text-[10px] uppercase tracking-wider text-mist">
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Stock</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel/40">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-mist">
                        {debouncedSearch
                          ? 'No products match your search — try another term or clear search.'
                          : lowStockOnly
                            ? 'No low-stock products — inventory looks healthy for this threshold.'
                            : 'No products on this page — add one above or go to another page.'}
                      </td>
                    </tr>
                  )}
                  {items.map((p) => (
                    <tr
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditingId(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setEditingId(p.id)
                        }
                      }}
                      className={`cursor-pointer text-mist hover:bg-steel/25 ${p.deleted ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-mist">{p.sku ?? '—'}</td>
                      <td className="max-w-[280px] px-4 py-3">
                        <p className="truncate font-medium text-fog">{p.name}</p>
                      </td>
                      <td className="px-4 py-3 text-mist">{p.category ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-fog">
                        {formatInr(p.actualPrice ?? p.price)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${
                          isAdminLowStock(p, lowStockThreshold) ? 'text-flare' : 'text-mist'
                        }`}
                      >
                        {p.totalStock ?? '—'}
                        {isAdminLowStock(p, lowStockThreshold) ? (
                          <span className="ml-2 rounded bg-flare-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-flare">
                            Low
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <ProductRowActions
                            product={p}
                            open={openActionsProductId === p.id}
                            onOpenChange={(next) => setOpenActionsProductId(next ? p.id : null)}
                            disabled={busyId === p.id || p.deleted}
                            onAddStock={(row) => setStockModalProduct(row)}
                            onEdit={(row) => setEditingId(row.id)}
                            onView={(row) => setEditingId(row.id)}
                            onDelete={(row) => remove(row)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.length === 0 && (
              <p className="admin-card col-span-full py-12 text-center text-mist">
                {debouncedSearch
                  ? 'No products match your search — try another term or clear search.'
                  : lowStockOnly
                    ? 'No low-stock products — inventory looks healthy for this threshold.'
                    : 'No products on this page.'}
              </p>
            )}
            {items.map((p) => {
              const hasImage = !!(p.image && String(p.image).trim())
              const imgSrc = hasImage ? resolveApiAssetUrl(p.image) ?? p.image : ''
              return (
                <article
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setEditingId(p.id)
                    }
                  }}
                  className="admin-card flex cursor-pointer flex-col overflow-hidden text-left transition-colors hover:border-accent/35"
                >
                  <div className="relative aspect-[4/3] bg-ink/40">
                    {hasImage ? (
                    <SafeImg
                      src={imgSrc}
                      alt=""
                      fw={480}
                      fh={360}
                      className="h-full w-full object-cover"
                    />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-steel/20 px-4 text-center">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-mist">No image</span>
                      </div>
                    )}
                    <span
                      className={
                        p.deleted
                          ? 'absolute right-2 top-2 rounded-full bg-flare-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-flare'
                          : p.published
                          ? 'absolute right-2 top-2 rounded-full bg-accent-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-accent'
                          : 'absolute right-2 top-2 rounded-full bg-steel/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-mist'
                      }
                    >
                      {p.deleted ? 'Deleted' : p.published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-mist">{p.sku}</p>
                    <h2 className="font-display text-sm font-bold uppercase leading-tight text-fog">{p.name}</h2>
                    <p className="text-[11px] text-mist">
                      <span className="capitalize">{p.type}</span>
                      <span className="mx-1 text-steel">·</span>
                      {p.category}
                    </p>
                    {p.description ? (
                      <p className="line-clamp-3 text-xs leading-relaxed text-mist">
                        {clipDescription(p.description, 220)}
                      </p>
                    ) : null}
                    {p.createdAt ? (
                      <p className="font-mono text-[10px] text-mist/80">
                        {new Date(p.createdAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-steel/40 pt-3">
                      <div className="flex flex-col">
                        <span className="font-display text-lg font-bold tabular-nums text-accent">
                          {formatInr(p.actualPrice ?? p.price)}
                        </span>
                        <span
                          className={`mt-0.5 font-mono text-[10px] uppercase tracking-wider ${
                            isAdminLowStock(p, lowStockThreshold) ? 'text-flare' : 'text-mist'
                          }`}
                        >
                          Stock {p.totalStock ?? '—'}
                          {isAdminLowStock(p, lowStockThreshold) ? ' · Low' : ''}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-mist">Sold {p.soldCount ?? 0}</span>
                    </div>
                    <p className={`font-mono text-[11px] ${(p.profitValue ?? 0) >= 0 ? 'text-accent' : 'text-flare'}`}>
                      P/L {formatInr(p.profitValue ?? 0)}
                    </p>
                    <div
                      className="flex justify-end border-t border-steel/40 pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ProductRowActions
                        product={p}
                        open={openActionsProductId === p.id}
                        onOpenChange={(next) => setOpenActionsProductId(next ? p.id : null)}
                        disabled={busyId === p.id || p.deleted}
                        onAddStock={(row) => setStockModalProduct(row)}
                        onEdit={(row) => setEditingId(row.id)}
                        onView={(row) => setEditingId(row.id)}
                        onDelete={(row) => remove(row)}
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-xl border border-steel/80 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
      </>
      ) : null}
    </div>
  )
}
