import Dexie, { type Table } from 'dexie'

export interface TestTask {
  id: string
  title: string
  created_at: string
}

export interface SyncQueueItem {
  id?: number
  operation: 'insert'
  table: string
  payload: TestTask
}

class AppDB extends Dexie {
  test_tasks!: Table<TestTask>
  sync_queue!: Table<SyncQueueItem>

  constructor() {
    super('sprintos')
    this.version(1).stores({
      test_tasks: 'id, created_at',
      sync_queue: '++id',
    })
  }
}

export const db = new AppDB()
