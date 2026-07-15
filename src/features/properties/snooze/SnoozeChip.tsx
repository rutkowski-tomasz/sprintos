import { Moon } from 'lucide-react'
import { Chip } from '../Chip'
import { formatSnooze, isSnoozed } from './snoozeDef'
import type { Task } from '@/types'

export const SNOOZE_COLOR = '#fb923c'

export function SnoozeChip({ task, now }: { task: Pick<Task, 'snooze' | 'eventDate'>; now: Date }) {
  if (!task.snooze || !isSnoozed(task, now)) return null
  return (
    <Chip color={SNOOZE_COLOR}>
      <Moon size={10} />
      {formatSnooze(task.snooze, now)}
    </Chip>
  )
}
