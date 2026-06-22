import { useLiveQuery } from 'dexie-react-hooks'
import { ViewHeader } from '@/components/layout/ViewHeader'
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
    <div className="h-full flex flex-col overflow-auto overscroll-contain pb-safe-nav md:pb-0">
      <ViewHeader viewName="All Tasks" />
      <div className="flex-1 overflow-auto overscroll-contain p-4">
        <TaskTable tasks={tasks ?? []} />
      </div>
    </div>
  )
}
