import { TaskStatus } from '@/types'

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
