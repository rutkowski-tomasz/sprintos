import { ViewHeader } from '@/features/navigation/ViewHeader'
import { TaskList } from '@/features/tasks/TaskList'
import { useSprintTasks } from '@/features/tasks/useSprintTasks'
import { sprintKeyOffset } from '@/features/properties/sprints/sprintEngine'

export function NextSprint() {
  const key = sprintKeyOffset(new Date(), 1)
  const result = useSprintTasks(key)

  if (!result) return null

  const { tasks } = result

  return (
    <div className="h-full flex flex-col">
      <ViewHeader viewName="Next Sprint" sprintKey={key} tasks={tasks} />
      <div className="flex-1 overflow-auto overscroll-contain">
        <TaskList tasks={tasks} />
      </div>
    </div>
  )
}
