export const TaskStatus = {
  TODO: 0,
  NEXT: 1,
  IN_PROGRESS: 2,
  DONE: 3,
  ARCHIVED: 4,
} as const

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export interface Goal {
  id: string
  userId: string
  name: string
  emoji: string | null
  quarter: string
  description: string | null
  version: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Sprint {
  id: string
  userId: string
  name: string
  startDate: string
  endDate: string
  version: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Task {
  id: string
  userId: string
  sprintId: string | null
  goalId: string | null
  name: string
  emoji: string | null
  status: TaskStatus
  eventDate: string | null
  snooze: string | null
  description: string | null
  sourceUrl: string | null
  duration: number | null
  version: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SyncQueueItem {
  id?: number
  operation: 'insert' | 'update' | 'delete'
  table: string
  payload: Record<string, unknown>
}
