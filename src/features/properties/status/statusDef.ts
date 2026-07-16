import { TaskStatus } from '@/types'
import type { ParseHit, PropertyParser, Token } from '../parser'

export const STATUS_COLOR = '#fb923c'

export const STATUS_LABEL: Record<number, string> = {
  [TaskStatus.TODO]: 'To-Do',
  [TaskStatus.NEXT]: 'Next',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.ARCHIVED]: 'Archived',
}

export const STATUS_BADGE: Record<number, string> = {
  [TaskStatus.TODO]: 'bg-zinc-500/15 text-zinc-400 border-transparent',
  [TaskStatus.NEXT]: 'bg-purple-500/15 text-purple-400 border-transparent',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-500/15 text-blue-400 border-transparent',
  [TaskStatus.DONE]: 'bg-emerald-500/15 text-emerald-400 border-transparent',
  [TaskStatus.ARCHIVED]: 'bg-zinc-400/10 text-zinc-500 border-transparent',
}

export const ALL_STATUSES = [
  TaskStatus.TODO,
  TaskStatus.NEXT,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
  TaskStatus.ARCHIVED,
] as const

const STATUS_MAP: Record<string, number> = {
  todo: TaskStatus.TODO,
  next: TaskStatus.NEXT,
  progress: TaskStatus.IN_PROGRESS,
  done: TaskStatus.DONE,
  archive: TaskStatus.ARCHIVED,
}

export const statusParser: PropertyParser = {
  key: 'status',
  parse(tokens: Token[]): ParseHit | null {
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].text.toLowerCase() === 'in' && tokens[i + 1].text.toLowerCase() === 'progress') {
        return { consume: [i, i + 1], start: tokens[i].start, end: tokens[i + 1].end, value: TaskStatus.IN_PROGRESS }
      }
    }
    for (let i = 0; i < tokens.length; i++) {
      const key = tokens[i].text.toLowerCase()
      if (key in STATUS_MAP && (i === 0 || i === tokens.length - 1)) {
        return { consume: [i], start: tokens[i].start, end: tokens[i].end, value: STATUS_MAP[key] }
      }
    }
    return null
  },
}
