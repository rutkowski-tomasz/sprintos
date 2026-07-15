import { formatEventDateShort } from './eventDateDef'

export function EventDate({ date, now }: { date: string; now: Date }) {
  return (
    <span className="text-xs text-muted-foreground shrink-0">{formatEventDateShort(date, now)}</span>
  )
}
