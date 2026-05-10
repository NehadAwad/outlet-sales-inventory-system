import type { Outlet } from '../types'
import { apiRequest } from './client'

export async function fetchOutlets(signal?: AbortSignal): Promise<Outlet[]> {
  const data = await apiRequest<Outlet[]>('/outlets', { signal })
  return data ?? []
}

export type CreateOutletPayload = {
  name: string
  code: string
  address?: string | null
}

export async function createOutlet(body: CreateOutletPayload): Promise<Outlet> {
  const payload: { name: string; code: string; address?: string | null } = {
    name: body.name.trim(),
    code: body.code.trim(),
  }
  const addr = body.address?.trim()
  if (addr) {
    payload.address = addr
  }

  const data = await apiRequest<Outlet>('/outlets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!data) {
    throw new Error('Server did not return outlet data')
  }
  return data
}
