import Dexie, { type Table } from 'dexie'
import type { Goal, Task, SyncQueueItem } from '@/types'

class AppDB extends Dexie {
  goals!: Table<Goal>
  tasks!: Table<Task>
  sync_queue!: Table<SyncQueueItem>

  constructor() {
    super('sprintos')
    this.version(1).stores({
      goals: 'id, userId',
      tasks: 'id, userId, sprint, goalId, status, createdAt',
      sync_queue: '++id',
    })
  }
}

export const db = new AppDB()
