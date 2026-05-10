import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ApiRequestError, isAbortError } from '../api/client'
import { fetchOutletInventory } from '../api/inventory'
import { fetchOutletMenu } from '../api/outletMenu'
import { fetchOutlets } from '../api/outlets'
import { createOutletSale } from '../api/sales'
import type { Outlet, OutletMenuItemRow } from '../types'
import { formatDecimal } from '../utils/money'

const selectClass =
  'mt-1 w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'
const qtyInputClass =
  'w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'

export default function CreateSale() {
  const outletSelectId = 'sale-outlet'

  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [outletsLoading, setOutletsLoading] = useState(true)
  const [outletsError, setOutletsError] = useState<string | null>(null)
  const [outletId, setOutletId] = useState('')

  const [assignments, setAssignments] = useState<OutletMenuItemRow[]>([])
  const [inventoryQty, setInventoryQty] = useState<Map<string, number>>(new Map())
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const [qtyByMenuItem, setQtyByMenuItem] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null)
  const [successTotal, setSuccessTotal] = useState<string | null>(null)

  const loadOutletsList = useCallback(async (signal?: AbortSignal) => {
    setOutletsError(null)
    setOutletsLoading(true)
    try {
      const list = await fetchOutlets(signal)
      setOutlets([...list].filter((o) => o.isActive).sort((a, b) => a.name.localeCompare(b.name)))
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

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => void loadOutletsList(ac.signal))
    return () => ac.abort()
  }, [loadOutletsList])

  const loadOutletSaleData = useCallback(async (oid: string, signal?: AbortSignal) => {
    if (!oid) {
      setAssignments([])
      setInventoryQty(new Map())
      setQtyByMenuItem({})
      return
    }
    setDataError(null)
    setDataLoading(true)
    setSuccessReceipt(null)
    setSuccessTotal(null)
    setFormError(null)
    try {
      const [menuRows, invRows] = await Promise.all([
        fetchOutletMenu(oid, signal),
        fetchOutletInventory(oid, signal),
      ])
      setAssignments(menuRows)
      const invMap = new Map(invRows.map((r) => [r.menuItemId, r.stockQty]))
      setInventoryQty(invMap)
      setQtyByMenuItem({})
    } catch (e) {
      if (isAbortError(e)) return
      const msg =
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : 'Could not load sale data'
      setDataError(msg)
      setAssignments([])
      setInventoryQty(new Map())
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => void loadOutletSaleData(outletId, ac.signal))
    return () => ac.abort()
  }, [outletId, loadOutletSaleData])

  const saleLines = useMemo(() => {
    return assignments
      .filter((a) => a.isActive && inventoryQty.has(a.menuItemId))
      .sort((a, b) => (a.menuItem?.name ?? '').localeCompare(b.menuItem?.name ?? ''))
  }, [assignments, inventoryQty])

  const cartTotal = useMemo(() => {
    let sum = 0
    for (const line of saleLines) {
      const q = Number.parseInt(qtyByMenuItem[line.menuItemId] ?? '0', 10)
      if (!Number.isFinite(q) || q <= 0) continue
      const unit = Number.parseFloat(line.price)
      if (!Number.isFinite(unit)) continue
      sum += unit * q
    }
    return sum
  }, [saleLines, qtyByMenuItem])

  async function handleCheckout(e: FormEvent) {
    e.preventDefault()
    if (!outletId) {
      setFormError('Select an outlet.')
      return
    }
    setFormError(null)
    setSuccessReceipt(null)
    setSuccessTotal(null)

    const items: { menuItemId: string; quantity: number }[] = []
    for (const line of saleLines) {
      const q = Number.parseInt(qtyByMenuItem[line.menuItemId] ?? '0', 10)
      if (!Number.isFinite(q) || q <= 0) continue
      const max = inventoryQty.get(line.menuItemId) ?? 0
      if (q > max) {
        setFormError(`Quantity for “${line.menuItem?.name ?? 'item'}” exceeds stock (${max}).`)
        return
      }
      items.push({ menuItemId: line.menuItemId, quantity: q })
    }

    if (items.length === 0) {
      setFormError('Enter at least one quantity greater than zero.')
      return
    }

    setSubmitting(true)
    try {
      const sale = await createOutletSale(outletId, { items })
      setSuccessReceipt(sale.receiptNumber)
      setSuccessTotal(sale.totalAmount)
      setQtyByMenuItem({})
      await loadOutletSaleData(outletId)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not complete sale'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const missingInventory = useMemo(() => {
    return assignments.filter((a) => a.isActive && !inventoryQty.has(a.menuItemId))
  }, [assignments, inventoryQty])

  return (
    <div className="space-y-10">
      <section aria-labelledby="sale-heading">
        <h1 id="sale-heading" className="text-xl font-semibold text-neutral-900">
          Create sale
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Ring up items from the outlet menu. Quantities cannot exceed on-hand stock.
        </p>
      </section>

      {(successReceipt || formError) && (
        <div className="space-y-2" role="status" aria-live="polite">
          {successReceipt && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Sale completed. Receipt <span className="font-mono font-semibold">{successReceipt}</span>
              {successTotal != null && (
                <>
                  {' '}
                  · Total <span className="font-medium">{formatDecimal(successTotal)}</span>
                </>
              )}
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
          {dataError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
              {dataError}
            </p>
          )}

          {missingInventory.length > 0 && !dataLoading && (
            <p className="text-sm text-amber-800">
              {missingInventory.length} assigned item(s) have no inventory row yet — add stock on the Inventory page
              to sell them.
            </p>
          )}

          <section
            aria-labelledby="sale-lines-heading"
            className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h2 id="sale-lines-heading" className="text-lg font-medium text-neutral-900">
              Items
            </h2>

            {dataLoading ? (
              <p className="mt-6 text-sm text-neutral-500">Loading menu and stock…</p>
            ) : saleLines.length === 0 && !dataError ? (
              <p className="mt-6 text-sm text-neutral-600">
                No sellable lines yet. Assign menu items and create inventory for this outlet.
              </p>
            ) : (
              <form className="mt-4 space-y-6" onSubmit={handleCheckout}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                          Item
                        </th>
                        <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                          Unit price
                        </th>
                        <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                          In stock
                        </th>
                        <th scope="col" className="py-3 font-medium text-neutral-700">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {saleLines.map((line) => {
                        const label = line.menuItem?.name ?? '—'
                        const stock = inventoryQty.get(line.menuItemId) ?? 0
                        return (
                          <tr key={line.menuItemId}>
                            <td className="py-3 pr-4 text-neutral-900">{label}</td>
                            <td className="py-3 pr-4 text-neutral-800">{formatDecimal(line.price)}</td>
                            <td className="py-3 pr-4 font-mono text-neutral-700">{stock}</td>
                            <td className="py-3">
                              <input
                                type="number"
                                min={0}
                                max={stock}
                                step={1}
                                value={qtyByMenuItem[line.menuItemId] ?? ''}
                                placeholder="0"
                                onChange={(ev) =>
                                  setQtyByMenuItem((prev) => ({
                                    ...prev,
                                    [line.menuItemId]: ev.target.value,
                                  }))
                                }
                                className={qtyInputClass}
                                aria-label={`Quantity for ${label}`}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-4">
                  <p className="text-sm text-neutral-700">
                    Cart total:{' '}
                    <span className="text-base font-semibold text-neutral-900">{formatDecimal(cartTotal)}</span>
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || saleLines.length === 0}
                    className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                  >
                    {submitting ? 'Processing…' : 'Complete sale'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-neutral-600">Select an outlet to start a sale.</p>
      )}
    </div>
  )
}
