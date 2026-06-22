import { TaskInput } from '@/components/tasks/TaskInput'
import { TaskTable } from '@/components/tasks/TaskTable'
import { useSprintTasks } from '@/hooks/useSprintTasks'

export function NextSprint() {
  const result = useSprintTasks('next')

  if (!result) return null

  const { sprintKey, tasks } = result

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto overscroll-contain p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Next Sprint</h2>
          {sprintKey && (
            <span className="text-sm text-muted-foreground">{sprintKey.replace(/^\d+ /, '')}</span>
          )}
        </div>
        <TaskTable tasks={tasks} />
      </div>
      <div className="shrink-0 border-t border-border px-4 pt-3 pb-safe-nav md:pb-3">
        <TaskInput sprint={sprintKey ?? null} />
      </div>
    </div>
  )
}
