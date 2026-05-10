/**
 * Turn API `errors` arrays (e.g. Zod issues from the backend) into readable text.
 */
export function formatValidationIssues(errors: unknown): string {
  if (!Array.isArray(errors) || errors.length === 0) return ''

  const parts: string[] = []
  for (const issue of errors) {
    if (!issue || typeof issue !== 'object') continue
    const rec = issue as Record<string, unknown>
    const msg = typeof rec.message === 'string' ? rec.message : null
    if (!msg) continue

    let label = ''
    if (Array.isArray(rec.path)) {
      const tail = rec.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number')
      const short = tail.filter((p) => p !== 'body' && p !== 'params' && p !== 'query')
      if (short.length > 0) {
        label = short.map(String).join('.')
      }
    }
    parts.push(label ? `${label}: ${msg}` : msg)
  }

  return parts.join('; ')
}
