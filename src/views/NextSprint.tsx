import { TaskList } from '@/components/tasks/TaskList'
import { TaskInput } from '@/components/tasks/TaskInput'
import { useSprintTasks } from '@/hooks/useSprintTasks'

export function NextSprint() {
  const result = useSprintTasks('next')

  if (!result) return null

  const { sprintKey, tasks } = result

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Next Sprint</h2>
          {sprintKey && <span className="text-sm text-muted-foreground">{sprintKey}</span>}
        </div>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks planned.</p>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>
      <div className="shrink-0 border-t border-border px-4 pt-3 pb-safe-nav md:pb-3">
        <TaskInput sprint={sprintKey ?? null} />
      </div>
    </div>
  )
}
