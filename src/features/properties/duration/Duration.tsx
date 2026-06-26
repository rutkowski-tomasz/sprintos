import { formatDurationClock } from './durationDef'

export function Duration({ seconds }: { seconds: number }) {
  return <span>{formatDurationClock(seconds)}</span>
}
