function format(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleString('en', { month: 'short' })
  if (d.getHours() === 0 && d.getMinutes() === 0) return `${day} ${month}`
  return `${day} ${month} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function EventDate({ date }: { date: string }) {
  return (
    <span className="text-xs text-muted-foreground shrink-0">{format(date)}</span>
  )
}
