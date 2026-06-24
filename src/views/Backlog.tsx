import { useLiveQuery } from 'dexie-react-hooks'
import { ViewHeader } from '@/components/layout/ViewHeader'
import { TaskInput } from '@/components/tasks/TaskInput'
import { TaskListMobile } from '@/components/tasks/TaskListMobile'
import { TaskTable } from '@/components/tasks/TaskTable'
import { db } from '@/lib/db'
import { TaskStatus, type Task } from '@/types'

export function Backlog() {
  const tasks = useLiveQuery(
    () => db.tasks.filter(t => t.deletedAt === null && t.status < TaskStatus.DONE).toArray(),
    [],
    [] as Task[],
  )

  return (
    <div className="h-full flex flex-col">
      <ViewHeader viewName="Backlog" />
      <div className="flex-1 overflow-auto overscroll-contain p-4 flex flex-col gap-4">
        <div className="md:hidden -mx-4">
          <TaskListMobile tasks={tasks ?? []} />
        </div>
        <div className="hidden md:block">
          <TaskTable tasks={tasks ?? []} />
        </div>
      </div>
      <div className="shrink-0 border-t border-border px-4 pt-3 pb-safe-nav md:pb-3">
        <TaskInput sprint={null} />
      </div>
    </div>
  )
}
