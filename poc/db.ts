import Dexie, { type Table } from 'dexie'

export interface Gizmo {
  id: string
  title: string
  created_at: string
}

export interface SyncQueueItem {
  id?: number
  operation: 'insert'
  payload: Gizmo
}

class AppDB extends Dexie {
  gizmos!: Table<Gizmo>
  sync_queue!: Table<SyncQueueItem>

  constructor() {
    super('sprintos_poc')
    this.version(1).stores({
      gizmos: 'id, created_at',
      sync_queue: '++id',
    })
  }
}

export const db = new AppDB()
