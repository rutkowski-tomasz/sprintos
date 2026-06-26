import { Chip } from './Chip'
import { CHIP_DEFS } from './registry'

type ChipProps =
  | { property: 'duration'; value: number }
  | { property: 'eventDate'; value: string }

export function PropertyChip({ property, value }: ChipProps) {
  const def = CHIP_DEFS[property]
  return <Chip color={def.color}>{def.format(value as never)}</Chip>
}
