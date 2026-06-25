function formatSnoozeDate(iso: string): string {
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

function snoozeText(snooze: string): string {
  if (snooze.startsWith('-')) {
    const secs = Math.abs(parseInt(snooze.slice(1)))
    const d = Math.floor(secs / 86400)
    const h = Math.floor(secs / 3600)
    if (d && secs % 86400 === 0) return `−${d}d`
    if (h) return `−${h}h`
    return `−${secs}s`
  }
  return `@${formatSnoozeDate(snooze)}`
}

export function SnoozeLabel({ snooze }: { snooze: string }) {
  return (
    <span className="text-xs text-indigo-400 shrink-0">{snoozeText(snooze)}</span>
  )
}
