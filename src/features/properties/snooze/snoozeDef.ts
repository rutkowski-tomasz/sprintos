import type { Task } from '@/types'
import { formatDateLabel } from '@/lib/dateLabel'
import { sprintDateRange, sprintKey, sprintKeyOffset } from '@/features/properties/sprint/sprintDef'

export interface SnoozeOption {
  key: string
  label: string
  getDate: (now: Date) => Date
  sameSprintOnly?: boolean
  movesSprint?: boolean
}

export function resolveSnoozeDate(task: Pick<Task, 'snooze' | 'eventDate'>): Date | null {
  if (!task.snooze) return null
  if (task.snooze.startsWith('-')) {
    if (!task.eventDate) return null
    const offsetMs = Math.abs(parseInt(task.snooze.slice(1))) * 1000
    return new Date(new Date(task.eventDate).getTime() - offsetMs)
  }
  return new Date(task.snooze)
}

export function isSnoozed(task: Pick<Task, 'snooze' | 'eventDate'>, now: Date): boolean {
  const date = resolveSnoozeDate(task)
  return date !== null && date > now
}

function sprintStart(key: string): Date {
  const d = new Date(sprintDateRange(key).start)
  d.setHours(8, 0, 0, 0)
  return d
}

export const SNOOZE_OPTIONS: SnoozeOption[] = [
  {
    key: 'evening',
    label: 'Evening',
    sameSprintOnly: true,
    getDate: now => { const d = new Date(now); d.setHours(18, 0, 0, 0); return d },
  },
  {
    key: 'tomorrow',
    label: 'Tomorrow',
    sameSprintOnly: true,
    getDate: now => { const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return d },
  },
  {
    key: 'day-after-tomorrow',
    label: 'Day after tomorrow',
    sameSprintOnly: true,
    getDate: now => { const d = new Date(now); d.setDate(d.getDate() + 2); d.setHours(8, 0, 0, 0); return d },
  },
  {
    key: 'next-sprint',
    label: 'Next sprint',
    movesSprint: true,
    getDate: now => sprintStart(sprintKeyOffset(now, 1)),
  },
  {
    key: 'future-sprint',
    label: 'Future sprint',
    movesSprint: true,
    getDate: now => sprintStart(sprintKeyOffset(now, 2)),
  },
]

export function defaultCustomDateTime(now: Date): string {
  const d = new Date(now)
  d.setDate(d.getDate() + 1)
  d.setHours(8, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function isWithinCurrentSprint(date: Date, now: Date): boolean {
  return sprintKey(date) === sprintKey(now)
}

export function formatSnoozeOptionDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${weekday}, ${time}`
}

export function formatSnooze(snooze: string, now: Date): string {
  if (snooze.startsWith('-')) {
    const secs = Math.abs(parseInt(snooze.slice(1)))
    const days = Math.floor(secs / 86400)
    const hours = Math.floor(secs / 3600)
    return days && secs % 86400 === 0 ? `−${days}d` : hours ? `−${hours}h` : `−${secs}s`
  }

  return `@${formatDateLabel(new Date(snooze), now)}`
}
