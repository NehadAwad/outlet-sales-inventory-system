import { apiRequest } from './client'
import type { RevenueByOutletRow, TopSellingItemRow } from '../types'

export async function fetchRevenueByOutlet(signal?: AbortSignal): Promise<RevenueByOutletRow[]> {
  const data = await apiRequest<RevenueByOutletRow[]>('/reports/revenue-by-outlet', { signal })
  return data ?? []
}

export async function fetchTopSellingItems(
  outletId: string,
  signal?: AbortSignal,
): Promise<TopSellingItemRow[]> {
  const data = await apiRequest<TopSellingItemRow[]>(
    `/reports/outlets/${outletId}/top-selling-items`,
    { signal },
  )
  return data ?? []
}
