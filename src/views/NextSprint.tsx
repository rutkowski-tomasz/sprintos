import { ViewHeader } from '@/components/layout/ViewHeader'
import { TaskListMobile } from '@/components/tasks/TaskListMobile'
import { TaskTable } from '@/components/tasks/TaskTable'
import { useSprintTasks } from '@/hooks/useSprintTasks'

export function NextSprint() {
  const result = useSprintTasks('next')

  if (!result) return null

  const { sprintKey, tasks } = result

  return (
    <div className="h-full flex flex-col">
      <ViewHeader viewName="Next Sprint" sprintKey={sprintKey} tasks={tasks} />
      <div className="flex-1 overflow-auto overscroll-contain p-4 flex flex-col gap-4">
        <div className="md:hidden -mx-4">
          <TaskListMobile tasks={tasks} />
        </div>
        <div className="hidden md:block">
          <TaskTable tasks={tasks} />
        </div>
      </div>
    </div>
  )
}
