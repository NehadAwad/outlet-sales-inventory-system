import { apiRequest } from './client'
import type { SaleDetail } from '../types'

export async function createOutletSale(
  outletId: string,
  body: { items: { menuItemId: string; quantity: number }[] },
): Promise<SaleDetail> {
  const data = await apiRequest<SaleDetail>(`/outlets/${outletId}/sales`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data) throw new Error('Server did not return sale data')
  return data
}
