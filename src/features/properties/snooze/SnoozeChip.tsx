import { Chip } from '../Chip'
import { formatSnooze, isSnoozed } from './snoozeDef'
import type { Task } from '@/types'

export const SNOOZE_COLOR = '#818cf8'

export function SnoozeChip({ task, now }: { task: Pick<Task, 'snooze' | 'eventDate'>; now: Date }) {
  if (!task.snooze || !isSnoozed(task, now)) return null
  return <Chip color={SNOOZE_COLOR}>{formatSnooze(task.snooze, now)}</Chip>
}
