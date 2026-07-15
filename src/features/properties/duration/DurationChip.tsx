import { Chip } from '../Chip'
import { DURATION_COLOR, formatDuration } from './durationDef'

export function DurationChip({ seconds }: { seconds: number }) {
  return <Chip color={DURATION_COLOR}>{formatDuration(seconds)}</Chip>
}
