import { formatEventDateShort } from './eventDateDef'

export function EventDate({ date }: { date: string }) {
  return (
    <span className="text-xs text-muted-foreground shrink-0">{formatEventDateShort(date)}</span>
  )
}
