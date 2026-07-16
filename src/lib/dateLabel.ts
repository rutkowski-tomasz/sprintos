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
  const hasTime = !(date.getHours() === 0 && date.getMinutes() === 0)
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  if (diff === 0) return hasTime ? `Today, ${time}` : 'Today'
  if (diff === 1) return hasTime ? `Tomorrow, ${time}` : 'Tomorrow'
  if (diff > 1 && diff < 7) {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
    return hasTime ? `${weekday}, ${time}` : weekday
  }

  const monthDay = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  return hasTime ? `${monthDay}, ${weekday} ${time}` : `${monthDay}, ${weekday}`
}
