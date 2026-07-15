import { Chip } from '../Chip'
import { EVENT_DATE_COLOR, formatEventDateShort } from './eventDateDef'

export function EventDateChip({ date, now }: { date: string; now: Date }) {
  return <Chip color={EVENT_DATE_COLOR}>{formatEventDateShort(date, now)}</Chip>
}
