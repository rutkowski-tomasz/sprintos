export interface SnoozeOption {
  key: string
  label: string
  getDate: (now: Date) => Date
}

function nextWeekday(now: Date, target: number): Date {
  const d = new Date(now)
  const diff = ((target - d.getDay()) + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d
}

export const SNOOZE_OPTIONS: SnoozeOption[] = [
  {
    key: 'evening',
    label: 'Evening',
    getDate: now => { const d = new Date(now); d.setHours(18, 0, 0, 0); return d },
  },
  {
    key: 'tomorrow',
    label: 'Tomorrow',
    getDate: now => { const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return d },
  },
  {
    key: 'day-after-tomorrow',
    label: 'Day after tomorrow',
    getDate: now => { const d = new Date(now); d.setDate(d.getDate() + 2); d.setHours(8, 0, 0, 0); return d },
  },
  {
    key: 'weekend',
    label: 'Weekend',
    getDate: now => { const d = nextWeekday(now, 6); d.setHours(8, 0, 0, 0); return d },
  },
  {
    key: 'next-week',
    label: 'Next week',
    getDate: now => { const d = nextWeekday(now, 1); d.setHours(8, 0, 0, 0); return d },
  },
]

export function formatSnoozeOptionDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${weekday}, ${time}`
}

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
