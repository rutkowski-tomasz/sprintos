import { useLiveQuery } from 'dexie-react-hooks'
import { TaskInput } from '@/components/tasks/TaskInput'
import { TaskTable } from '@/components/tasks/TaskTable'
import { db } from '@/lib/db'
import { TaskStatus, type Task } from '@/types'

export function Planning() {
  const tasks = useLiveQuery(
    () => db.tasks.filter(t => t.deletedAt === null && t.status < TaskStatus.DONE).toArray(),
    [],
    [] as Task[],
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Planning</h2>
        <TaskTable tasks={tasks ?? []} />
      </div>
      <div className="shrink-0 border-t border-border px-4 pt-3 pb-safe-nav md:pb-3">
        <TaskInput sprint={null} />
      </div>
    </div>
  )
}
