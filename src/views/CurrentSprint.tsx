import { ViewHeader } from '@/features/navigation/ViewHeader'
import { TaskList } from '@/features/tasks/TaskList'
import { useSprintTasks } from '@/features/tasks/useSprintTasks'
import { sprintKey } from '@/features/properties/sprint/sprintDef'

export function CurrentSprint() {
  const key = sprintKey(new Date())
  const result = useSprintTasks(key)

  if (!result) return null

  const { tasks } = result

  return (
    <div className="h-full flex flex-col">
      <ViewHeader viewName="Current Sprint" sprintKey={key} tasks={tasks} />
      <div className="flex-1 overflow-auto overscroll-contain pb-safe-nav">
        <TaskList tasks={tasks} />
      </div>
    </div>
  )
}
