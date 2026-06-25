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
