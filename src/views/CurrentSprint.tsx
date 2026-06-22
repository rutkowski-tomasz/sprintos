import { TaskInput } from '@/components/tasks/TaskInput'
import { TaskListMobile } from '@/components/tasks/TaskListMobile'
import { TaskTable } from '@/components/tasks/TaskTable'
import { useSprintTasks } from '@/hooks/useSprintTasks'

export function CurrentSprint() {
  const result = useSprintTasks('current')

  if (!result) return null

  const { sprintKey, tasks } = result

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto overscroll-contain p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current Sprint</h2>
          {sprintKey && (
            <span className="text-sm text-muted-foreground">{sprintKey.replace(/^\d+ /, '')}</span>
          )}
        </div>
        <div className="md:hidden -mx-4">
          <TaskListMobile tasks={tasks} />
        </div>
        <div className="hidden md:block">
          <TaskTable tasks={tasks} />
        </div>
      </div>
      <div className="shrink-0 border-t border-border px-4 pt-3 pb-safe-nav md:pb-3">
        <TaskInput sprint={sprintKey ?? null} />
      </div>
    </div>
  )
}
