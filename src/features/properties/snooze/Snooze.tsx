function format(snooze: string): string {
  if (snooze.startsWith('-')) {
    const secs = Math.abs(parseInt(snooze.slice(1)))
    const d = Math.floor(secs / 86400)
    const h = Math.floor(secs / 3600)
    return d && secs % 86400 === 0 ? `−${d}d` : h ? `−${h}h` : `−${secs}s`
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

export function Snooze({ snooze }: { snooze: string }) {
  return (
    <span className="text-xs text-indigo-400 shrink-0">{format(snooze)}</span>
  )
}
