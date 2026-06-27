import { formatSnooze } from './snoozeDef'

export function Snooze({ snooze }: { snooze: string }) {
  return (
    <span className="text-xs text-indigo-400 shrink-0">{formatSnooze(snooze)}</span>
  )
}
