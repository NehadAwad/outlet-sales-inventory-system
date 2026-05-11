import type { ApiErrorBody, ApiSuccess } from '../types'
import { formatValidationIssues } from '../utils/apiErrors'

const DEV_DEFAULT_API_BASE = 'http://localhost:5000/api/v1'

function getBaseUrl(): string | undefined {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (raw) return raw
  if (import.meta.env.DEV) return DEV_DEFAULT_API_BASE
  return undefined
}

export class ApiRequestError extends Error {
  readonly statusCode: number
  readonly errors: unknown[]

  constructor(message: string, statusCode: number, errors: unknown[] = []) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

/** When `fetch` is aborted (React strict mode, route/outlet change), browsers throw DOMException/Error — do not wrap as ApiRequestError. */
export function isAbortError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const err = e as { name?: string; message?: string }
  if (err.name === 'AbortError') return true
  if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') return true
  if (typeof err.message === 'string' && /\babort(ed)?\b/i.test(err.message)) return true
  return false
}

/**
 * Calls the POS JSON API. On HTTP success, returns the parsed `data` field (may be undefined).
 * On failure, throws {@link ApiRequestError} with server message when present.
 */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T | undefined> {
  const base = getBaseUrl()
  if (!base) {
    throw new ApiRequestError(
      'Missing VITE_API_BASE_URL — configure .env for local dev or Vercel env vars.',
      0,
    )
  }

  const url = joinUrl(base, path)
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body != null) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers,
      signal: init?.signal,
    })
  } catch (e) {
    if (isAbortError(e)) throw e
    const msg = e instanceof Error ? e.message : 'Network error'
    throw new ApiRequestError(msg, 0)
  }

  let body: unknown
  try {
    const text = await response.text()
    body = text === '' ? null : JSON.parse(text)
  } catch {
    throw new ApiRequestError(
      response.ok ? 'Invalid JSON response' : 'Could not parse error response',
      response.status,
    )
  }

  if (!response.ok) {
    const err = body as Partial<ApiErrorBody>
    let message =
      typeof err.message === 'string' && err.message
        ? err.message
        : `Request failed (${response.status})`
    const errors = Array.isArray(err.errors) ? err.errors : []
    const detail = formatValidationIssues(errors)
    if (detail) {
      message =
        message === 'Validation failed' || message.startsWith('Request failed')
          ? detail
          : `${message}: ${detail}`
    }
    throw new ApiRequestError(message, response.status, errors)
  }

  const payload = body as ApiSuccess<T> | ApiErrorBody | null
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    payload.success === false
  ) {
    const failure = payload as ApiErrorBody
    throw new ApiRequestError(
      failure.message || 'Request failed',
      response.status,
      Array.isArray(failure.errors) ? failure.errors : [],
    )
  }

  if (
    payload &&
    typeof payload === 'object' &&
    payload.success === true
  ) {
    return (payload as ApiSuccess<T>).data
  }

  return undefined
}
