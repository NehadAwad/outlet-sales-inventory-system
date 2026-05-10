import { useCallback, useEffect, useId, useState } from 'react'
import { ApiRequestError, isAbortError } from '../api/client'
import { fetchOutlets } from '../api/outlets'
import { fetchRevenueByOutlet, fetchTopSellingItems } from '../api/reports'
import type { Outlet, RevenueByOutletRow, TopSellingItemRow } from '../types'
import { formatDecimal } from '../utils/money'

const selectClass =
  'mt-1 w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'

export default function Reports() {
  const formId = useId()
  const outletSelectId = `${formId}-outlet`

  const [revenueRows, setRevenueRows] = useState<RevenueByOutletRow[]>([])
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [revenueError, setRevenueError] = useState<string | null>(null)

  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [outletsLoading, setOutletsLoading] = useState(true)
  const [topOutletId, setTopOutletId] = useState('')
  const [topRows, setTopRows] = useState<TopSellingItemRow[]>([])
  const [topLoading, setTopLoading] = useState(false)
  const [topError, setTopError] = useState<string | null>(null)

  const loadRevenue = useCallback(async (signal?: AbortSignal) => {
    setRevenueError(null)
    setRevenueLoading(true)
    try {
      const data = await fetchRevenueByOutlet(signal)
      setRevenueRows(data)
    } catch (e) {
      if (isAbortError(e)) return
      const msg =
        e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : 'Could not load revenue report'
      setRevenueError(msg)
      setRevenueRows([])
    } finally {
      setRevenueLoading(false)
    }
  }, [])

  const loadOutletsList = useCallback(async (signal?: AbortSignal) => {
    setOutletsLoading(true)
    try {
      const list = await fetchOutlets(signal)
      setOutlets([...list].sort((a, b) => a.name.localeCompare(b.name)))
    } catch {
      setOutlets([])
    } finally {
      setOutletsLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => {
      void loadRevenue(ac.signal)
      void loadOutletsList(ac.signal)
    })
    return () => ac.abort()
  }, [loadRevenue, loadOutletsList])

  const loadTop = useCallback(async (oid: string, signal?: AbortSignal) => {
    if (!oid) {
      setTopRows([])
      return
    }
    setTopError(null)
    setTopLoading(true)
    try {
      const data = await fetchTopSellingItems(oid, signal)
      setTopRows(data)
    } catch (e) {
      if (isAbortError(e)) return
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not load top sellers'
      setTopError(msg)
      setTopRows([])
    } finally {
      setTopLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => void loadTop(topOutletId, ac.signal))
    return () => ac.abort()
  }, [topOutletId, loadTop])

  return (
    <div className="space-y-10">
      <section aria-labelledby="reports-heading">
        <h1 id="reports-heading" className="text-xl font-semibold text-neutral-900">
          Reports
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Revenue across outlets and top-selling menu items per outlet (up to five lines).
        </p>
      </section>

      <section
        aria-labelledby="revenue-heading"
        className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="revenue-heading" className="text-lg font-medium text-neutral-900">
            Revenue by outlet
          </h2>
          <button
            type="button"
            onClick={() => void loadRevenue()}
            disabled={revenueLoading}
            className="rounded-sm text-sm font-medium text-neutral-700 underline-offset-2 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          >
            Refresh
          </button>
        </div>

        {revenueError && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
            {revenueError}
          </p>
        )}

        {revenueLoading ? (
          <p className="mt-6 text-sm text-neutral-500">Loading revenue…</p>
        ) : revenueRows.length === 0 && !revenueError ? (
          <p className="mt-6 text-sm text-neutral-600">No outlet data yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    Outlet
                  </th>
                  <th scope="col" className="py-3 font-medium text-neutral-700">
                    Total revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {revenueRows.map((row) => (
                  <tr key={row.outletId}>
                    <td className="py-3 pr-4 text-neutral-900">{row.outletName}</td>
                    <td className="py-3 text-neutral-800">{formatDecimal(row.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-labelledby="top-heading"
        className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h2 id="top-heading" className="text-lg font-medium text-neutral-900">
          Top selling items
        </h2>
        <p className="mt-1 text-sm text-neutral-600">Ranked by quantity sold for the selected outlet.</p>

        <label htmlFor={outletSelectId} className="mt-4 block text-sm font-medium text-neutral-700">
          Outlet
        </label>
        <select
          id={outletSelectId}
          value={topOutletId}
          onChange={(ev) => setTopOutletId(ev.target.value)}
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

        {topError && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
            {topError}
          </p>
        )}

        {!topOutletId ? (
          <p className="mt-6 text-sm text-neutral-600">Choose an outlet to load rankings.</p>
        ) : topLoading ? (
          <p className="mt-6 text-sm text-neutral-500">Loading top sellers…</p>
        ) : topRows.length === 0 && !topError ? (
          <p className="mt-6 text-sm text-neutral-600">No sales recorded for this outlet yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    Item
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    Qty sold
                  </th>
                  <th scope="col" className="py-3 font-medium text-neutral-700">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {topRows.map((row) => (
                  <tr key={row.menuItemId}>
                    <td className="py-3 pr-4 text-neutral-900">{row.name}</td>
                    <td className="py-3 pr-4 font-mono text-neutral-800">{row.totalQuantity}</td>
                    <td className="py-3 text-neutral-800">{formatDecimal(row.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
