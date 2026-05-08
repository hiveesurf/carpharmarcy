import { useCallback, useEffect, useState } from 'react'
import { Eye, EyeOff, LayoutGrid, LayoutList, Pencil, Trash2 } from 'lucide-react'
import { AddProductPanel } from '../components/AddProductPanel.jsx'
import { BulkImportProductsPanel } from '../components/BulkImportProductsPanel.jsx'
import { ProductEditDrawer } from '../components/ProductEditDrawer.jsx'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'
import { getPartImage } from '../../data/partsCatalog.js'
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
const LOW_STOCK_THRESHOLD = 5

export function AdminProductsPage() {
  const { sessionRole } = useAuth()
  const canEditProducts = sessionRole === 'super_admin' || sessionRole === 'sales'
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [sort, setSort] = useState('created_desc')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [viewMode, setViewMode] = useState('list')
  const [listRefresh, setListRefresh] = useState(0)
  const lowStockCount = items.filter((p) => Number(p?.totalStock ?? 0) <= LOW_STOCK_THRESHOLD).length

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
      })
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
  }, [nextPage, sort, listRefresh])

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
          {lowStockCount > 0 ? (
            <p className="mt-2 text-xs text-flare">
              Low stock alert: {lowStockCount} product(s) at or below {LOW_STOCK_THRESHOLD} units.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            className="rounded-xl border border-steel/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mist transition-colors hover:border-accent/50 hover:text-accent"
          >
            Refresh list
          </button>
        </div>
      </div>

      <AddProductPanel onCreated={onProductCreated} /> 

      <BulkImportProductsPanel onCompleted={bumpList} />

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
          onSaved={(updated) => mergeSavedProduct(updated)}
        />
      )}

      {loading ? (
        <p className="font-mono text-xs text-mist">Loading products…</p>
      ) : viewMode === 'list' ? (
        <>
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto pb-1">
              <table className="min-w-[1280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-steel/50 font-mono text-[10px] uppercase tracking-wider text-mist">
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Actual</th>
                    <th className="hidden px-4 py-3 text-right font-medium xl:table-cell">Purchase</th>
                    <th className="hidden px-4 py-3 text-right font-medium xl:table-cell">Sold</th>
                    <th className="hidden px-4 py-3 text-right font-medium xl:table-cell">Profit/Loss</th>
                    <th className="px-4 py-3 font-medium text-right">Stock</th>
                    <th className="hidden px-4 py-3 font-medium xl:table-cell">Created</th>
                    <th className="px-4 py-3 font-medium text-center">Live</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel/40">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-4 py-10 text-center text-mist">
                        No products on this page — add one above or go to another page.
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
                      <td className="max-w-[240px] px-4 py-3">
                        <p className="truncate font-medium text-fog">{p.name}</p>
                        {p.description ? (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-mist">
                            {clipDescription(p.description, 100)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 capitalize text-mist">{p.type}</td>
                      <td className="px-4 py-3 text-mist">{p.category}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-fog">{formatInr(p.actualPrice ?? p.price)}</td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-mist xl:table-cell">{formatInr(p.purchasePrice)}</td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-mist xl:table-cell">{p.soldCount ?? 0}</td>
                      <td className={`hidden px-4 py-3 text-right tabular-nums xl:table-cell ${(p.profitValue ?? 0) >= 0 ? 'text-accent' : 'text-flare'}`}>
                        {formatInr(p.profitValue ?? 0)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${
                          Number(p.totalStock ?? 0) <= LOW_STOCK_THRESHOLD ? 'text-flare' : 'text-mist'
                        }`}
                      >
                        {p.totalStock ?? '—'}
                        {Number(p.totalStock ?? 0) <= LOW_STOCK_THRESHOLD ? (
                          <span className="ml-2 rounded bg-flare-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-flare">
                            Low
                          </span>
                        ) : null}
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-[10px] text-mist xl:table-cell">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={
                            p.published
                              ? 'inline-flex rounded-full bg-accent-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent'
                              : 'inline-flex rounded-full bg-steel/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist'
                          }
                        >
                          {p.deleted ? 'Deleted' : p.published ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={busyId === p.id || p.deleted}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingId(p.id)
                            }}
                            className="rounded-lg p-2 text-mist hover:bg-steel/50 hover:text-hud disabled:opacity-40"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === p.id || p.deleted}
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePublish(p)
                            }}
                            className="rounded-lg p-2 text-mist hover:bg-steel/50 hover:text-accent disabled:opacity-40"
                            title={p.published ? 'Unpublish' : 'Publish'}
                          >
                            {p.published ? (
                              <Eye className="h-4 w-4" strokeWidth={1.75} />
                            ) : (
                              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === p.id || p.deleted}
                            onClick={(e) => {
                              e.stopPropagation()
                              remove(p)
                            }}
                            className="rounded-lg p-2 text-mist hover:bg-flare-muted hover:text-flare disabled:opacity-40"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
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
                No products on this page.
              </p>
            )}
            {items.map((p) => {
              const img = p.image
                ? { src: resolveApiAssetUrl(p.image) ?? p.image, alt: p.name }
                : getPartImage(p.imageKey)
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
                    <SafeImg
                      src={img.src}
                      alt=""
                      fw={480}
                      fh={360}
                      className="h-full w-full object-cover"
                    />
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
                      </div>
                      <span className="font-mono text-xs text-mist">Sold {p.soldCount ?? 0}</span>
                    </div>
                    <p className={`font-mono text-[11px] ${(p.profitValue ?? 0) >= 0 ? 'text-accent' : 'text-flare'}`}>
                      P/L {formatInr(p.profitValue ?? 0)}
                    </p>
                    <div className="flex justify-end gap-1 border-t border-steel/40 pt-2">
                      <button
                        type="button"
                        disabled={busyId === p.id || p.deleted}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(p.id)
                        }}
                        className="rounded-lg p-2 text-mist hover:bg-steel/50 hover:text-hud disabled:opacity-40"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p.id || p.deleted}
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePublish(p)
                        }}
                        className="rounded-lg p-2 text-mist hover:bg-steel/50 hover:text-accent disabled:opacity-40"
                        title={p.published ? 'Unpublish' : 'Publish'}
                      >
                        {p.published ? (
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                        ) : (
                          <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p.id || p.deleted}
                        onClick={(e) => {
                          e.stopPropagation()
                          remove(p)
                        }}
                        className="rounded-lg p-2 text-mist hover:bg-flare-muted hover:text-flare disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
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
