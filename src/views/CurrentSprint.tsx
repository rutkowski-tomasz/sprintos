import { ViewHeader } from '@/features/navigation/ViewHeader'
import { TaskList } from '@/features/tasks/TaskList'
import { useSprintTasks } from '@/features/tasks/useSprintTasks'

export function CurrentSprint() {
  const result = useSprintTasks('current')

  if (!result) return null

  const { sprintKey, tasks } = result

  return (
    <div className="h-full flex flex-col">
      <ViewHeader viewName="Current Sprint" sprintKey={sprintKey} tasks={tasks} />
      <div className="flex-1 overflow-auto overscroll-contain">
        <TaskList tasks={tasks} />
      </div>
    </div>
  )
}
