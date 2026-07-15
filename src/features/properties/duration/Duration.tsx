import { formatDuration } from './durationDef'

export function Duration({ seconds }: { seconds: number }) {
  return <span>{formatDuration(seconds)}</span>
}
