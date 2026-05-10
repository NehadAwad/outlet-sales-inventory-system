/**
 * Format numeric strings from the API for display (fixed 2 decimals).
 */
export function formatDecimal(value: string | number): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
