import { TaskList } from '@/components/tasks/TaskList'
import { useSprintTasks } from '@/hooks/useSprintTasks'

export function NextSprint() {
  const result = useSprintTasks('next')

  if (!result) return null

  const { sprintKey, tasks } = result

  return (
    <div className="p-6 flex flex-col gap-4">
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
  )
}
