import Dexie, { type Table } from 'dexie'
import type { Goal, Sprint, Task, SyncQueueItem } from '@/types'

class AppDB extends Dexie {
  goals!: Table<Goal>
  sprints!: Table<Sprint>
  tasks!: Table<Task>
  sync_queue!: Table<SyncQueueItem>

  constructor() {
    super('sprintos')
    this.version(1).stores({
      goals: 'id, userId',
      sprints: 'id, userId, startDate, endDate',
      tasks: 'id, userId, sprintId, goalId, status, createdAt',
      sync_queue: '++id',
    })
  }
}

export const db = new AppDB()
