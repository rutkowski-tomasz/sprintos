import { Chip } from '../Chip'
import { eventDateColor, formatEventDateShort } from './eventDateDef'

export function EventDateChip({ date, now }: { date: string; now: Date }) {
  return <Chip color={eventDateColor(new Date(date), now)}>{formatEventDateShort(date, now)}</Chip>
}
