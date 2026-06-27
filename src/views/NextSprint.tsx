import { ViewHeader } from '@/features/navigation/ViewHeader'
import { TaskList } from '@/features/tasks/TaskList'
import { useSprintTasks } from '@/features/tasks/useSprintTasks'
import { sprintKeyOffset } from '@/features/properties/sprint/sprintDef'

export function NextSprint() {
  const key = sprintKeyOffset(new Date(), 1)
  const tasks = useSprintTasks(key)

  if (!tasks) return null

  return (
    <div className="h-full flex flex-col">
      <ViewHeader viewName="Next Sprint" sprintKey={key} tasks={tasks} />
      <div className="flex-1 overflow-auto overscroll-contain pb-safe-nav">
        <TaskList tasks={tasks} />
      </div>
    </div>
  )
}
