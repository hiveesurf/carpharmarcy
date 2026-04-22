import { Fragment, useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import * as adminService from '../../services/adminService.js'
import { getFetchErrorMessage } from '../../lib/apiErrorMessage.js'

const PAGE_SIZE = 5

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(v)
  } catch {
    return `₹${v}`
  }
}

export function AdminCategoriesPage() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const load = useCallback(async (reset = true) => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminService.listCategoriesPage({ page: reset ? 0 : nextPage, size: PAGE_SIZE })
      if (reset) {
        setItems(result.items)
      } else {
        setItems((prev) => [...prev, ...result.items])
      }
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch (e) {
      setError(getFetchErrorMessage(e))
      if (reset) setItems([])
      setHasMore(false)
      setNextPage(1)
    } finally {
      setLoading(false)
    }
  }, [nextPage])

  useEffect(() => {
    load()
  }, [load])

  async function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setSaving(true)
    setError(null)
    try {
      await adminService.createCategory(n)
      setName('')
      await load(true)
    } catch (err) {
      setError(getFetchErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove(row) {
    if (row.deleted) return
    if (!window.confirm(`Delete category “${row.name}” (${row.id})? Products must be moved or deleted first.`))
      return
    setBusyId(row.id)
    try {
      await adminService.removeCategory(row.id)
      if (expandedId === row.id) setExpandedId(null)
      await load(true)
    } catch (err) {
      setError(getFetchErrorMessage(err))
    } finally {
      setBusyId(null)
    }
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

  function toggleExpand(id) {
    setExpandedId((x) => (x === id ? null : id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-fog sm:text-3xl">
          Categories
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Product counts, order revenue by group, and who created each category. New names typed when adding a product
          are created automatically on save.
        </p>
      </div>

      <form
        onSubmit={add}
        className="admin-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="cat-name" className="font-sans text-xs font-semibold uppercase tracking-wide text-mist">
            New category name
          </label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Brakes"
            className="admin-input mt-1.5 w-full px-3 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-xl bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-on-accent shadow-md transition-[transform,filter] hover:brightness-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-flare/40 bg-flare-muted px-4 py-3 text-sm text-fog">{error}</div>
      )}

      {loading && items.length === 0 ? (
        <p className="font-mono text-xs text-mist">Loading categories…</p>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-steel/50 font-sans text-xs font-semibold uppercase tracking-wide text-mist">
                  <th className="w-10 px-3 py-3 font-medium" aria-label="Expand" />
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium text-right">Products</th>
                  <th className="px-4 py-3 font-medium text-right">Purchased</th>
                  <th className="px-4 py-3 font-medium">Added by</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/40">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-mist">
                      No categories.
                    </td>
                  </tr>
                )}
                {items.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="text-mist hover:bg-steel/25">
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggleExpand(c.id)}
                          className="rounded-lg p-1 text-mist hover:bg-steel/50 hover:text-fog"
                          aria-expanded={expandedId === c.id}
                          title={expandedId === c.id ? 'Collapse' : 'Show products'}
                        >
                          {expandedId === c.id ? (
                            <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                          ) : (
                            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-fog">
                        <span>{c.name}</span>
                        {c.deleted ? (
                          <span className="ml-2 inline-flex rounded-full bg-flare-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-flare">
                            Deleted
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-mist">{c.id}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-fog">{c.productCount ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-accent">
                        {formatInr(c.purchasedValueInr)}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-mist">
                        {c.createdByAdminEmail || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={busyId === c.id || c.deleted}
                          onClick={() => remove(c)}
                          className="rounded-lg p-2 text-mist hover:bg-flare-muted hover:text-flare disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr className="admin-row-muted">
                        <td colSpan={7} className="px-4 py-4">
                          <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-mist">
                            Products in “{c.name}”
                          </p>
                          {(c.products?.length ?? 0) === 0 ? (
                            <p className="font-sans text-xs text-mist">No products in this category.</p>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-steel/50 bg-slate/35">
                              <table className="w-full min-w-[640px] text-left text-xs">
                                <thead>
                                  <tr className="border-b border-steel/40 font-sans text-[10px] font-semibold uppercase tracking-wide text-mist">
                                    <th className="px-3 py-2">Name</th>
                                    <th className="px-3 py-2">SKU</th>
                                    <th className="px-3 py-2 text-right">Price</th>
                                    <th className="px-3 py-2 text-center">Live</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-steel/30">
                                  {c.products.map((p) => (
                                    <tr key={p.id} className="text-mist">
                                      <td className="px-3 py-2 text-fog">{p.name}</td>
                                      <td className="px-3 py-2 font-mono">{p.sku}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">{formatInr(p.priceInr)}</td>
                                      <td className="px-3 py-2 text-center font-mono text-[10px]">
                                        {p.published ? (
                                          <span className="text-accent">Yes</span>
                                        ) : (
                                          <span className="text-mist">No</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-xl border border-steel/80 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
