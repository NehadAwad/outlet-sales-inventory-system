import { apiRequest } from './client'
import type { InventoryRow } from '../types'

export async function fetchOutletInventory(
  outletId: string,
  signal?: AbortSignal,
): Promise<InventoryRow[]> {
  const data = await apiRequest<InventoryRow[]>(`/outlets/${outletId}/inventory`, { signal })
  return data ?? []
}

export async function createOutletInventory(
  outletId: string,
  body: { menuItemId: string; stockQty: number },
): Promise<InventoryRow> {
  const data = await apiRequest<InventoryRow>(`/outlets/${outletId}/inventory`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data) throw new Error('Server did not return inventory data')
  return data
}

export async function updateOutletInventory(
  outletId: string,
  menuItemId: string,
  body: { stockQty: number },
): Promise<InventoryRow> {
  const data = await apiRequest<InventoryRow>(`/outlets/${outletId}/inventory/${menuItemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!data) throw new Error('Server did not return inventory data')
  return data
}
