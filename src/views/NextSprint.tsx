import { TaskList } from '@/components/tasks/TaskList'
import { useSprintTasks } from '@/hooks/useSprintTasks'

export function NextSprint() {
  const result = useSprintTasks('next')

  if (!result) return null

  const { sprint, tasks } = result

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Next Sprint</h2>
        {sprint && <span className="text-sm text-muted-foreground">{sprint.name}</span>}
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {sprint ? 'No tasks planned.' : 'No next sprint found.'}
        </p>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  )
}
