import { type FormEvent, useCallback, useEffect, useId, useState } from 'react'
import { ApiRequestError, isAbortError } from '../api/client'
import { activateMenuItem, createMenuItem, deactivateMenuItem, fetchMenuItems } from '../api/menuItems'
import type { MenuItem } from '../types'
import { formatDecimal } from '../utils/money'

const inputClass =
  'mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'

export default function MasterMenu() {
  const formId = useId()
  const nameId = `${formId}-name`
  const skuId = `${formId}-sku`
  const descId = `${formId}-desc`
  const priceId = `${formId}-price`

  const [items, setItems] = useState<MenuItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [rowActionId, setRowActionId] = useState<string | null>(null)

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setListError(null)
    setListLoading(true)
    try {
      const list = await fetchMenuItems(signal)
      setItems([...list].sort((a, b) => a.name.localeCompare(b.name)))
    } catch (e) {
      if (isAbortError(e)) return
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not load menu items'
      setListError(msg)
      setItems([])
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => void loadItems(ac.signal))
    return () => ac.abort()
  }, [loadItems])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    const priceNum = Number.parseFloat(basePrice)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setFormError('Enter a valid base price greater than zero.')
      return
    }
    setSubmitting(true)
    try {
      await createMenuItem({
        name,
        sku,
        description: description.trim() === '' ? undefined : description,
        basePrice: priceNum,
      })
      setName('')
      setSku('')
      setDescription('')
      setBasePrice('')
      setSuccessMessage('Menu item created.')
      await loadItems()
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not create menu item'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(item: MenuItem) {
    if (!window.confirm(`Deactivate “${item.name}”? It will no longer be assignable to outlets.`)) return
    setRowActionId(item.id)
    setFormError(null)
    setSuccessMessage(null)
    try {
      await deactivateMenuItem(item.id)
      setSuccessMessage(`“${item.name}” deactivated.`)
      await loadItems()
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not deactivate item'
      setFormError(msg)
    } finally {
      setRowActionId(null)
    }
  }

  async function handleActivate(item: MenuItem) {
    setRowActionId(item.id)
    setFormError(null)
    setSuccessMessage(null)
    try {
      await activateMenuItem(item.id)
      setSuccessMessage(`“${item.name}” is active again and can be assigned to outlets.`)
      await loadItems()
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not activate item'
      setFormError(msg)
    } finally {
      setRowActionId(null)
    }
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="menu-heading">
        <h1 id="menu-heading" className="text-xl font-semibold text-neutral-900">
          Master menu
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Maintain the global catalog. SKUs may use letters, numbers, dots, underscores, and hyphens. Deactivate items
          you no longer want to assign; inactive rows can be activated again anytime.
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

      <section
        aria-labelledby="create-item-heading"
        className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h2 id="create-item-heading" className="text-lg font-medium text-neutral-900">
          Create menu item
        </h2>
        <form className="mt-4 max-w-xl space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={nameId} className="block text-sm font-medium text-neutral-700">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              id={nameId}
              required
              maxLength={150}
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={skuId} className="block text-sm font-medium text-neutral-700">
              SKU <span className="text-red-600">*</span>
            </label>
            <input
              id={skuId}
              required
              maxLength={80}
              pattern="[A-Za-z0-9._-]+"
              title="Letters, numbers, dot, underscore, hyphen only — no spaces"
              value={sku}
              onChange={(ev) => setSku(ev.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-500">
              No spaces. Example: <span className="font-mono">PIZZA-01</span> or <span className="font-mono">pizza_01</span>.
            </p>
          </div>
          <div>
            <label htmlFor={descId} className="block text-sm font-medium text-neutral-700">
              Description
            </label>
            <textarea
              id={descId}
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={priceId} className="block text-sm font-medium text-neutral-700">
              Base price <span className="text-red-600">*</span>
            </label>
            <input
              id={priceId}
              type="number"
              required
              min={0.01}
              step="any"
              value={basePrice}
              onChange={(ev) => setBasePrice(ev.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          >
            {submitting ? 'Creating…' : 'Create menu item'}
          </button>
        </form>
      </section>

      <section
        aria-labelledby="menu-list-heading"
        className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="menu-list-heading" className="text-lg font-medium text-neutral-900">
            All menu items
          </h2>
          <button
            type="button"
            onClick={() => void loadItems()}
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
          <p className="mt-6 text-sm text-neutral-500">Loading items…</p>
        ) : items.length === 0 && !listError ? (
          <p className="mt-6 text-sm text-neutral-600">No menu items yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    Name
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    SKU
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    Base price
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
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 text-neutral-900">{item.name}</td>
                    <td className="py-3 pr-4 font-mono text-neutral-800">{item.sku}</td>
                    <td className="py-3 pr-4 text-neutral-800">{formatDecimal(item.basePrice)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          item.isActive
                            ? 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                            : 'inline-flex rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700'
                        }
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">
                      {item.isActive ? (
                        <button
                          type="button"
                          disabled={rowActionId === item.id}
                          onClick={() => void handleDeactivate(item)}
                          className="text-sm font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-sm"
                        >
                          {rowActionId === item.id ? 'Working…' : 'Deactivate'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={rowActionId === item.id}
                          onClick={() => void handleActivate(item)}
                          className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-sm"
                        >
                          {rowActionId === item.id ? 'Working…' : 'Activate'}
                        </button>
                      )}
                    </td>
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
