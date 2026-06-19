export function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleString('en', { month: 'short' })
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  if (hasTime) {
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${h}:${m}`
  }
  return `${day} ${month}`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function formatSnooze(snooze: string): string {
  if (snooze.startsWith('-')) {
    const secs = Math.abs(parseInt(snooze.slice(1)))
    const d = Math.floor(secs / 86400)
    const h = Math.floor(secs / 3600)
    if (d && secs % 86400 === 0) return `−${d}d before event`
    if (h) return `−${h}h before event`
    return `−${secs}s before event`
  }
  return `snooze until ${formatDate(snooze)}`
}
