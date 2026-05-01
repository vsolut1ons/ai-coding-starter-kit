export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' })
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  const days = Math.floor(hours / 24)
  return rtf.format(-days, 'day')
}
