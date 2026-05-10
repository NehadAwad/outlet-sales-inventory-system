import { type FormEvent, useCallback, useEffect, useId, useState } from 'react'
import { ApiRequestError } from '../api/client'
import { createOutlet, fetchOutlets } from '../api/outlets'
import type { Outlet } from '../types'

function formatAddress(value: string | null): string {
  if (value == null || value === '') {
    return '—'
  }
  return value
}

export default function Outlets() {
  const formId = useId()
  const nameId = `${formId}-name`
  const codeId = `${formId}-code`
  const addressId = `${formId}-address`

  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadOutlets = useCallback(async (signal?: AbortSignal) => {
    setListError(null)
    setListLoading(true)
    try {
      const list = await fetchOutlets(signal)
      setOutlets(list)
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not load outlets'
      setListError(msg)
      setOutlets([])
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    queueMicrotask(() => {
      void loadOutlets(ac.signal)
    })
    return () => ac.abort()
  }, [loadOutlets])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      await createOutlet({
        name,
        code,
        address: address.trim() === '' ? undefined : address,
      })
      setName('')
      setCode('')
      setAddress('')
      setSuccessMessage('Outlet created.')
      await loadOutlets()
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not create outlet'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="outlets-heading">
        <h1 id="outlets-heading" className="text-xl font-semibold text-neutral-900">
          Outlets
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          View all outlets and register new locations. Codes must use letters, numbers, underscores, or hyphens only.
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
        aria-labelledby="create-outlet-heading"
        className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h2 id="create-outlet-heading" className="text-lg font-medium text-neutral-900">
          Create outlet
        </h2>
        <form className="mt-4 max-w-xl space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor={nameId} className="block text-sm font-medium text-neutral-700">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              id={nameId}
              name="name"
              required
              maxLength={150}
              autoComplete="organization"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            />
          </div>
          <div>
            <label htmlFor={codeId} className="block text-sm font-medium text-neutral-700">
              Code <span className="text-red-600">*</span>
            </label>
            <input
              id={codeId}
              name="code"
              required
              maxLength={50}
              pattern="[A-Za-z0-9_-]+"
              title="Letters, numbers, underscores, and hyphens only"
              autoComplete="off"
              value={code}
              onChange={(ev) => setCode(ev.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            />
            <p className="mt-1 text-xs text-neutral-500">Max 50 characters. Allowed: A–Z, a–z, 0–9, _, -</p>
          </div>
          <div>
            <label htmlFor={addressId} className="block text-sm font-medium text-neutral-700">
              Address
            </label>
            <textarea
              id={addressId}
              name="address"
              rows={3}
              maxLength={2000}
              value={address}
              onChange={(ev) => setAddress(ev.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          >
            {submitting ? 'Creating…' : 'Create outlet'}
          </button>
        </form>
      </section>

      <section
        aria-labelledby="outlet-list-heading"
        className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="outlet-list-heading" className="text-lg font-medium text-neutral-900">
            All outlets
          </h2>
          <button
            type="button"
            onClick={() => void loadOutlets()}
            disabled={listLoading}
            className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 rounded-sm"
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
          <p className="mt-6 text-sm text-neutral-500">Loading outlets…</p>
        ) : outlets.length === 0 && !listError ? (
          <p className="mt-6 text-sm text-neutral-600">No outlets yet. Create one above.</p>
        ) : outlets.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    Name
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    Code
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium text-neutral-700">
                    Address
                  </th>
                  <th scope="col" className="py-3 font-medium text-neutral-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {outlets.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 pr-4 text-neutral-900">{o.name}</td>
                    <td className="py-3 pr-4 font-mono text-neutral-800">{o.code}</td>
                    <td className="max-w-xs py-3 pr-4 text-neutral-700">{formatAddress(o.address)}</td>
                    <td className="py-3">
                      <span
                        className={
                          o.isActive
                            ? 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                            : 'inline-flex rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700'
                        }
                      >
                        {o.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}
