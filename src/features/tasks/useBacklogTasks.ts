import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { TaskStatus, type Task } from '@/types'

export function useBacklogTasks(): Task[] | undefined {
  return useLiveQuery(
    () => db.tasks.filter(t => t.deletedAt === null && t.status < TaskStatus.DONE).toArray(),
    [],
  )
}
