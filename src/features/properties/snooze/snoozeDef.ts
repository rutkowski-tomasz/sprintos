export function formatSnooze(snooze: string): string {
  if (snooze.startsWith('-')) {
    const secs = Math.abs(parseInt(snooze.slice(1)))
    const days = Math.floor(secs / 86400)
    const hours = Math.floor(secs / 3600)
    return days && secs % 86400 === 0 ? `−${days}d` : hours ? `−${hours}h` : `−${secs}s`
  }

  const dt = new Date(snooze)
  const day = dt.getDate()
  const month = dt.toLocaleString('en', { month: 'short' })
  const hasTime = dt.getHours() !== 0 || dt.getMinutes() !== 0
  const time = hasTime
    ? ` ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
    : ''
  return `@${day} ${month}${time}`
}
