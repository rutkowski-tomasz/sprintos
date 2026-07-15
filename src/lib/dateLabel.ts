function startOfDay(d: Date): Date {
  const s = new Date(d)
  s.setHours(0, 0, 0, 0)
  return s
}

function dayDiff(date: Date, now: Date): number {
  const msPerDay = 86400000
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / msPerDay)
}

export function formatDateLabel(date: Date, now: Date): string {
  const diff = dayDiff(date, now)
  const datePart =
    diff === 0 ? 'Today'
    : diff === 1 ? 'Tomorrow'
    : diff > 1 && diff < 7 ? date.toLocaleDateString('en-US', { weekday: 'long' })
    : `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`

  if (date.getHours() === 0 && date.getMinutes() === 0) return datePart
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${datePart}, ${time}`
}
