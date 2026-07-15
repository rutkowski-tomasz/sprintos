import { formatSnooze } from './snoozeDef'

export function Snooze({ snooze, now }: { snooze: string; now: Date }) {
  return (
    <span className="text-xs text-indigo-400 shrink-0">{formatSnooze(snooze, now)}</span>
  )
}
