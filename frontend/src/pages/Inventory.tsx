import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { ApiRequestError, isAbortError } from '../api/client'
import { fetchOutletInventory, createOutletInventory, updateOutletInventory } from '../api/inventory'
import { fetchOutlets } from '../api/outlets'
import { fetchMenuItems } from '../api/menuItems'
import type { InventoryRow, Outlet } from '../types'

const inputClass =
  'rounded-md border border-neutral-300 px-2 py-1.5 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'
const selectClass =
  'mt-1 w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'

export default function Inventory() {
  const formId = useId()
  const outletSelectId = `${formId}-outlet`
  const menuSelectId = `${formId}-menu`
  const stockId = `${formId}-stock`

  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [outletsLoading, setOutletsLoading] = useState(true)
  const [outletsError, setOutletsError] = useState<string | null>(null)
  const [outletId, setOutletId] = useState('')

  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof fetchMenuItems>>>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  const [rows, setRows] = useState<InventoryRow[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({})

  const [pickMenuItemId, setPickMenuItemId] = useState('')
  const [newStockQty, setNewStockQty] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [rowBusy, setRowBusy] = useState<string | null>(null)

  const loadOutletsList = useCallback(async (signal?: AbortSignal) => {
    setOutletsError(null)
    setOutletsLoading(true)
    try {
      const list = await fetchOutlets(signal)
      setOutlets([...list].sort((a, b) => a.name.localeCompare(b.name)))
    } catch (e) {
      if (isAbortError(e)) return
      const msg =
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : 'Could not load outlets'
      setOutletsError(msg)
      setOutlets([])
    } finally {
      setOutletsLoading(false)
    }
  }, [])

  const loadCatalog = useCallback(async (signal?: AbortSignal) => {
    setCatalogLoading(true)
    try {
      const items = await fetchMenuItems(signal)
      setCatalog(items)
    } catch {
      setCatalog([])
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => {
      void loadOutletsList(ac.signal)
      void loadCatalog(ac.signal)
    })
    return () => ac.abort()
  }, [loadOutletsList, loadCatalog])

  const loadInventory = useCallback(async (oid: string, signal?: AbortSignal) => {
    if (!oid) {
      setRows([])
      setStockDrafts({})
      return
    }
    setListError(null)
    setListLoading(true)
    try {
      const list = await fetchOutletInventory(oid, signal)
      setRows(list)
      const drafts: Record<string, string> = {}
      for (const r of list) {
        drafts[r.menuItemId] = String(r.stockQty)
      }
      setStockDrafts(drafts)
    } catch (e) {
      if (isAbortError(e)) return
      const msg =
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : 'Could not load inventory'
      setListError(msg)
      setRows([])
      setStockDrafts({})
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => void loadInventory(outletId, ac.signal))
    return () => ac.abort()
  }, [outletId, loadInventory])

  const existingMenuIds = useMemo(() => new Set(rows.map((r) => r.menuItemId)), [rows])

  const addableMenuItems = useMemo(() => {
    return catalog
      .filter((m) => m.isActive && !existingMenuIds.has(m.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [catalog, existingMenuIds])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!outletId) {
      setFormError('Select an outlet.')
      return
    }
    setFormError(null)
    setSuccessMessage(null)
    const qty = Number.parseInt(newStockQty, 10)
    if (!pickMenuItemId || !Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
      setFormError('Choose a menu item and enter a non-negative whole number for stock.')
      return
    }
    setSubmitting(true)
    try {
      await createOutletInventory(outletId, { menuItemId: pickMenuItemId, stockQty: qty })
      setPickMenuItemId('')
      setNewStockQty('')
      setSuccessMessage('Inventory line added.')
      await loadInventory(outletId)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not add inventory'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function saveStock(menuItemId: string) {
    if (!outletId) return
    const raw = stockDrafts[menuItemId]
    const qty = Number.parseInt(raw ?? '', 10)
    if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
      setFormError('Stock must be a non-negative whole number.')
      return
    }
    setFormError(null)
    setSuccessMessage(null)
    setRowBusy(menuItemId)
    try {
      await updateOutletInventory(outletId, menuItemId, { stockQty: qty })
      setSuccessMessage('Stock updated.')
      await loadInventory(outletId)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not update stock'
      setFormError(msg)
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="inv-heading">
        <h1 id="inv-heading" className="text-xl font-semibold text-neutral-900">
          Inventory
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Select an outlet to view stock levels and add or adjust quantities per menu item.
        </p>
      </section>

      {(successMessage || formError) && (
        <div className="space-y-2" role="status" aria-live="polite">
          {successMessage && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {successMessage}
            </p>
          )}
          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{formError}</p>
          )}
        </div>
      )}

      <section className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm">
        <label htmlFor={outletSelectId} className="block text-sm font-medium text-neutral-700">
          Outlet
        </label>
        <select
          id={outletSelectId}
          value={outletId}
          onChange={(ev) => setOutletId(ev.target.value)}
          disabled={outletsLoading}
          className={selectClass}
        >
          <option value="">{outletsLoading ? 'Loading outlets…' : 'Select outlet'}</option>
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.code})
            </option>
          ))}
        </select>
        {outletsError && (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {outletsError}
          </p>
        )}
      </section>

      {outletId ? (
        <>
          <section
            aria-labelledby="add-inv-heading"
            className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h2 id="add-inv-heading" className="text-lg font-medium text-neutral-900">
              Add stock line
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Only catalog items not yet tracked for this outlet are listed.
            </p>
            <form className="mt-4 max-w-xl space-y-4" onSubmit={handleAdd}>
              <div>
                <label htmlFor={menuSelectId} className="block text-sm font-medium text-neutral-700">
                  Menu item <span className="text-red-600">*</span>
                </label>
                <select
                  id={menuSelectId}
                  required
                  value={pickMenuItemId}
                  onChange={(ev) => setPickMenuItemId(ev.target.value)}
                  disabled={catalogLoading || addableMenuItems.length === 0}
                  className={selectClass}
                >
                  <option value="">
                    {catalogLoading
                      ? 'Loading catalog…'
                      : addableMenuItems.length === 0
                        ? 'All active items already have inventory'
                        : 'Select item'}
                  </option>
                  {addableMenuItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={stockId} className="block text-sm font-medium text-neutral-700">
                  Stock quantity <span className="text-red-600">*</span>
                </label>
                <input
                  id={stockId}
                  type="number"
                  min={0}
                  step={1}
                  value={newStockQty}
                  onChange={(ev) => setNewStockQty(ev.target.value)}
                  className={`mt-1 max-w-xs block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400`}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || addableMenuItems.length === 0}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              >
                {submitting ? 'Adding…' : 'Add inventory'}
              </button>
            </form>
          </section>

          <section
            aria-labelledby="inv-list-heading"
            className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="inv-list-heading" className="text-lg font-medium text-neutral-900">
                Stock on hand
              </h2>
              <button
                type="button"
                onClick={() => void loadInventory(outletId)}
                disabled={listLoading}
                className="rounded-sm text-sm font-medium text-neutral-700 underline-offset-2 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              >
                Refresh
              </button>
            </div>

            {listError && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
                {listError}
              </p>
            )}

            {listLoading ? (
              <p className="mt-6 text-sm text-neutral-500">Loading inventory…</p>
            ) : rows.length === 0 && !listError ? (
              <p className="mt-6 text-sm text-neutral-600">No inventory rows for this outlet yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                        Item
                      </th>
                      <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                        SKU
                      </th>
                      <th scope="col" className="py-3 font-medium text-neutral-700">
                        Stock qty
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.map((row) => {
                      const label = row.menuItem?.name ?? '—'
                      const sku = row.menuItem?.sku ?? '—'
                      return (
                        <tr key={row.id}>
                          <td className="py-3 pr-4 text-neutral-900">{label}</td>
                          <td className="py-3 pr-4 font-mono text-neutral-800">{sku}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={stockDrafts[row.menuItemId] ?? String(row.stockQty)}
                                onChange={(ev) =>
                                  setStockDrafts((prev) => ({
                                    ...prev,
                                    [row.menuItemId]: ev.target.value,
                                  }))
                                }
                                className={`w-24 ${inputClass}`}
                                aria-label={`Stock for ${label}`}
                              />
                              <button
                                type="button"
                                disabled={rowBusy === row.menuItemId}
                                onClick={() => void saveStock(row.menuItemId)}
                                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                              >
                                Update
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-neutral-600">Select an outlet to manage inventory.</p>
      )}
    </div>
  )
}
