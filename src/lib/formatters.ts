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
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h) return `${String(h).padStart(2, '0')}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function parseDuration(input: string): number | null {
  const s = input.trim()
  if (!s) return null
  if (!/^[\d:]+$/.test(s)) return null

  const parts = s.split(':')
  const nums = parts.map(p => parseInt(p, 10))
  if (nums.some(isNaN)) return null

  if (parts.length === 1) return nums[0]

  if (parts.length === 2) {
    const [m, sec] = nums
    if (sec > 59) return null
    return m * 60 + sec
  }

  if (parts.length === 3) {
    const [h, m, sec] = nums
    if (m > 59 || sec > 59) return null
    return h * 3600 + m * 60 + sec
  }

  return null
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
