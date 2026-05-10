import { apiRequest } from './client'
import type { MenuItem } from '../types'

export async function fetchMenuItems(signal?: AbortSignal): Promise<MenuItem[]> {
  const data = await apiRequest<MenuItem[]>('/menu-items', { signal })
  return data ?? []
}

export async function createMenuItem(body: {
  name: string
  sku: string
  description?: string | null
  basePrice: number
}): Promise<MenuItem> {
  const payload: Record<string, unknown> = {
    name: body.name.trim(),
    sku: body.sku.trim(),
    basePrice: body.basePrice,
  }
  const desc = body.description?.trim()
  if (desc) payload.description = desc

  const data = await apiRequest<MenuItem>('/menu-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!data) throw new Error('Server did not return menu item data')
  return data
}

export async function deactivateMenuItem(menuItemId: string): Promise<void> {
  await apiRequest(`/menu-items/${menuItemId}`, { method: 'DELETE' })
}

export type PatchMenuItemBody = {
  name?: string
  sku?: string
  description?: string | null
  basePrice?: number
  isActive?: boolean
}

export async function patchMenuItem(menuItemId: string, body: PatchMenuItemBody): Promise<MenuItem> {
  const data = await apiRequest<MenuItem>(`/menu-items/${menuItemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!data) throw new Error('Server did not return menu item data')
  return data
}

export async function activateMenuItem(menuItemId: string): Promise<MenuItem> {
  return patchMenuItem(menuItemId, { isActive: true })
}
