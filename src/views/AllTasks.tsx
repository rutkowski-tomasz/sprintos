import { useLiveQuery } from 'dexie-react-hooks'
import { TaskTable } from '@/components/tasks/TaskTable'
import { db } from '@/lib/db'
import type { Task } from '@/types'

export function AllTasks() {
  const tasks = useLiveQuery(
    () => db.tasks.filter(t => t.deletedAt === null).toArray(),
    [],
    [] as Task[],
  )

  return (
    <div className="h-full overflow-auto p-4 pb-safe-nav md:pb-4">
      <TaskTable tasks={tasks ?? []} />
    </div>
  )
}
