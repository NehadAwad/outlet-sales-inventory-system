import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { ApiRequestError, isAbortError } from '../api/client'
import { fetchOutlets } from '../api/outlets'
import {
  assignOutletMenuItem,
  fetchOutletMenu,
  removeOutletMenuItem,
  updateOutletMenuItem,
} from '../api/outletMenu'
import { fetchMenuItems } from '../api/menuItems'
import type { Outlet, OutletMenuItemRow } from '../types'

const inputClass =
  'rounded-md border border-neutral-300 px-2 py-1.5 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'
const selectClass =
  'mt-1 w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'

export default function AssignMenu() {
  const formId = useId()
  const outletSelectId = `${formId}-outlet`
  const menuSelectId = `${formId}-menu`
  const priceId = `${formId}-price`

  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [outletsLoading, setOutletsLoading] = useState(true)
  const [outletsError, setOutletsError] = useState<string | null>(null)
  const [outletId, setOutletId] = useState('')

  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof fetchMenuItems>>>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  const [assignments, setAssignments] = useState<OutletMenuItemRow[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})

  const [pickMenuItemId, setPickMenuItemId] = useState('')
  const [assignPrice, setAssignPrice] = useState('')
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

  const loadAssignments = useCallback(async (oid: string, signal?: AbortSignal) => {
    if (!oid) {
      setAssignments([])
      setPriceDrafts({})
      return
    }
    setAssignError(null)
    setAssignLoading(true)
    try {
      const rows = await fetchOutletMenu(oid, signal)
      setAssignments(rows)
      const drafts: Record<string, string> = {}
      for (const r of rows) {
        drafts[r.menuItemId] = r.price
      }
      setPriceDrafts(drafts)
    } catch (e) {
      if (isAbortError(e)) return
      const msg =
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : 'Could not load assignments'
      setAssignError(msg)
      setAssignments([])
      setPriceDrafts({})
    } finally {
      setAssignLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => void loadAssignments(outletId, ac.signal))
    return () => ac.abort()
  }, [outletId, loadAssignments])

  const assignableItems = useMemo(() => {
    const activeAssigned = new Set(
      assignments.filter((a) => a.isActive).map((a) => a.menuItemId),
    )
    return catalog
      .filter((m) => m.isActive && !activeAssigned.has(m.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [catalog, assignments])

  async function handleAssign(e: FormEvent) {
    e.preventDefault()
    if (!outletId) {
      setFormError('Select an outlet first.')
      return
    }
    setFormError(null)
    setSuccessMessage(null)
    const p = Number.parseFloat(assignPrice)
    if (!pickMenuItemId || !Number.isFinite(p) || p <= 0) {
      setFormError('Choose a menu item and enter a valid price.')
      return
    }
    setSubmitting(true)
    try {
      await assignOutletMenuItem(outletId, { menuItemId: pickMenuItemId, price: p })
      setPickMenuItemId('')
      setAssignPrice('')
      setSuccessMessage('Menu item assigned to outlet.')
      await loadAssignments(outletId)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not assign item'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function savePrice(menuItemId: string) {
    if (!outletId) return
    const raw = priceDrafts[menuItemId]
    const p = Number.parseFloat(raw ?? '')
    if (!Number.isFinite(p) || p <= 0) {
      setFormError('Enter a valid price.')
      return
    }
    setFormError(null)
    setSuccessMessage(null)
    setRowBusy(menuItemId)
    try {
      await updateOutletMenuItem(outletId, menuItemId, { price: p })
      setSuccessMessage('Price updated.')
      await loadAssignments(outletId)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not update price'
      setFormError(msg)
    } finally {
      setRowBusy(null)
    }
  }

  async function handleRemove(menuItemId: string, label: string) {
    if (!outletId) return
    if (!window.confirm(`Remove “${label}” from this outlet menu?`)) return
    setFormError(null)
    setSuccessMessage(null)
    setRowBusy(menuItemId)
    try {
      await removeOutletMenuItem(outletId, menuItemId)
      setSuccessMessage(`Removed “${label}”.`)
      await loadAssignments(outletId)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not remove assignment'
      setFormError(msg)
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="assign-heading">
        <h1 id="assign-heading" className="text-xl font-semibold text-neutral-900">
          Assign menu
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Choose an outlet, then assign catalog items with outlet-specific selling prices.
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
            aria-labelledby="assign-new-heading"
            className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h2 id="assign-new-heading" className="text-lg font-medium text-neutral-900">
              Assign menu item
            </h2>
            <form className="mt-4 max-w-xl space-y-4" onSubmit={handleAssign}>
              <div>
                <label htmlFor={menuSelectId} className="block text-sm font-medium text-neutral-700">
                  Menu item <span className="text-red-600">*</span>
                </label>
                <select
                  id={menuSelectId}
                  required
                  value={pickMenuItemId}
                  onChange={(ev) => setPickMenuItemId(ev.target.value)}
                  disabled={catalogLoading || assignableItems.length === 0}
                  className={selectClass}
                >
                  <option value="">
                    {catalogLoading
                      ? 'Loading catalog…'
                      : assignableItems.length === 0
                        ? 'No items available to assign'
                        : 'Select item'}
                  </option>
                  {assignableItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={priceId} className="block text-sm font-medium text-neutral-700">
                  Outlet price <span className="text-red-600">*</span>
                </label>
                <input
                  id={priceId}
                  type="number"
                  min={0.01}
                  step="any"
                  value={assignPrice}
                  onChange={(ev) => setAssignPrice(ev.target.value)}
                  className={`mt-1 max-w-xs ${inputClass} block w-full`}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || assignableItems.length === 0}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              >
                {submitting ? 'Assigning…' : 'Assign to outlet'}
              </button>
            </form>
          </section>

          <section
            aria-labelledby="assigned-heading"
            className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="assigned-heading" className="text-lg font-medium text-neutral-900">
                Assigned items
              </h2>
              <button
                type="button"
                onClick={() => void loadAssignments(outletId)}
                disabled={assignLoading}
                className="rounded-sm text-sm font-medium text-neutral-700 underline-offset-2 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              >
                Refresh
              </button>
            </div>

            {assignError && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
                {assignError}
              </p>
            )}

            {assignLoading ? (
              <p className="mt-6 text-sm text-neutral-500">Loading assignments…</p>
            ) : assignments.length === 0 && !assignError ? (
              <p className="mt-6 text-sm text-neutral-600">Nothing assigned yet for this outlet.</p>
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
                      <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                        Price
                      </th>
                      <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                        Status
                      </th>
                      <th scope="col" className="py-3 font-medium text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {assignments.map((row) => {
                      const label = row.menuItem?.name ?? '—'
                      const sku = row.menuItem?.sku ?? '—'
                      return (
                        <tr key={row.id}>
                          <td className="py-3 pr-4 text-neutral-900">{label}</td>
                          <td className="py-3 pr-4 font-mono text-neutral-800">{sku}</td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                min={0.01}
                                step="any"
                                value={priceDrafts[row.menuItemId] ?? row.price}
                                onChange={(ev) =>
                                  setPriceDrafts((prev) => ({
                                    ...prev,
                                    [row.menuItemId]: ev.target.value,
                                  }))
                                }
                                disabled={!row.isActive}
                                className={`w-28 ${inputClass}`}
                                aria-label={`Price for ${label}`}
                              />
                              <button
                                type="button"
                                disabled={!row.isActive || rowBusy === row.menuItemId}
                                onClick={() => void savePrice(row.menuItemId)}
                                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                              >
                                Update
                              </button>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={
                                row.isActive
                                  ? 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                                  : 'inline-flex rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700'
                              }
                            >
                              {row.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              disabled={rowBusy === row.menuItemId || !row.isActive}
                              onClick={() => void handleRemove(row.menuItemId, label)}
                              className="text-sm font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-sm"
                            >
                              Remove
                            </button>
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
        <p className="text-sm text-neutral-600">Select an outlet to manage its menu.</p>
      )}
    </div>
  )
}
