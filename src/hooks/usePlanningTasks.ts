import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { classifySprints, type SprintLabel } from '@/lib/sprintEngine'
import { TaskStatus, type Sprint, type Task } from '@/types'

const STATUS_ORDER: Record<number, number> = {
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.NEXT]: 1,
  [TaskStatus.TODO]: 2,
}

export interface PlanningGroup {
  sprint: Sprint | null
  sprintLabel: SprintLabel | undefined
  tasks: Task[]
}

export function usePlanningTasks(): PlanningGroup[] | undefined {
  return useLiveQuery(async () => {
    const [allSprints, allTasks] = await Promise.all([
      db.sprints.orderBy('startDate').toArray(),
      db.tasks.filter(t => t.deletedAt === null && t.status < TaskStatus.DONE).toArray(),
    ])

    allTasks.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

    const sprintLabels = classifySprints(allSprints, new Date())

    const grouped = new Map<string | null, Task[]>()
    for (const task of allTasks) {
      const key = task.sprintId
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(task)
    }

    const result: PlanningGroup[] = []

    for (const sprint of allSprints) {
      const tasks = grouped.get(sprint.id)
      if (tasks?.length) {
        result.push({ sprint, sprintLabel: sprintLabels.get(sprint.id), tasks })
      }
    }

    const unassigned = grouped.get(null)
    if (unassigned?.length) {
      result.push({ sprint: null, sprintLabel: undefined, tasks: unassigned })
    }

    return result
  })
}
