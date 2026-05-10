import { apiRequest } from './client'
import type { OutletMenuItemRow } from '../types'

export async function fetchOutletMenu(
  outletId: string,
  signal?: AbortSignal,
): Promise<OutletMenuItemRow[]> {
  const data = await apiRequest<OutletMenuItemRow[]>(`/outlets/${outletId}/menu-items`, {
    signal,
  })
  return data ?? []
}

export async function assignOutletMenuItem(
  outletId: string,
  body: { menuItemId: string; price: number },
): Promise<OutletMenuItemRow> {
  const data = await apiRequest<OutletMenuItemRow>(`/outlets/${outletId}/menu-items`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data) throw new Error('Server did not return assignment data')
  return data
}

export async function updateOutletMenuItem(
  outletId: string,
  menuItemId: string,
  body: { price?: number; isActive?: boolean },
): Promise<OutletMenuItemRow> {
  const data = await apiRequest<OutletMenuItemRow>(
    `/outlets/${outletId}/menu-items/${menuItemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
  if (!data) throw new Error('Server did not return assignment data')
  return data
}

export async function removeOutletMenuItem(outletId: string, menuItemId: string): Promise<void> {
  await apiRequest(`/outlets/${outletId}/menu-items/${menuItemId}`, { method: 'DELETE' })
}
