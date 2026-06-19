import { TaskList } from '@/components/tasks/TaskList'
import { TaskInput } from '@/components/tasks/TaskInput'
import { usePlanningTasks } from '@/hooks/usePlanningTasks'
import type { SprintLabel } from '@/lib/sprintEngine'

const LABEL_BADGE: Partial<Record<SprintLabel, string>> = {
  current: 'Current',
  next: 'Next',
  previous: 'Previous',
}

export function Planning() {
  const groups = usePlanningTasks()

  if (!groups) return null

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Planning</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No incomplete tasks.</p>
        ) : (
          groups.map((group) => {
            const key = group.sprint ?? 'unassigned'
            const badge = group.sprintLabel ? LABEL_BADGE[group.sprintLabel] : undefined

            return (
              <section key={key} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.sprint ?? 'Unassigned'}
                  </h3>
                  {badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {badge}
                    </span>
                  )}
                </div>
                <TaskList tasks={group.tasks} />
              </section>
            )
          })
        )}
      </div>
      <div className="shrink-0 border-t border-border px-4 pt-3 pb-safe-nav md:pb-3">
        <TaskInput sprint={null} />
      </div>
    </div>
  )
}
