import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { classifySprintKey, compareSprintKeys, type SprintLabel } from '@/lib/sprintEngine'
import { TaskStatus, type Task } from '@/types'

const STATUS_ORDER: Record<number, number> = {
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.NEXT]: 1,
  [TaskStatus.TODO]: 2,
}

export interface PlanningGroup {
  sprint: string | null
  sprintLabel: SprintLabel | undefined
  tasks: Task[]
}

export function usePlanningTasks(): PlanningGroup[] | undefined {
  return useLiveQuery(async () => {
    const allTasks = await db.tasks
      .filter(t => t.deletedAt === null && t.status < TaskStatus.DONE)
      .toArray()

    allTasks.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

    const now = new Date()
    const grouped = new Map<string | null, Task[]>()

    for (const task of allTasks) {
      const key = task.sprint
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(task)
    }

    const sprintKeys = [...grouped.keys()]
      .filter((k): k is string => k !== null)
      .sort(compareSprintKeys)

    const result: PlanningGroup[] = sprintKeys.map(key => ({
      sprint: key,
      sprintLabel: classifySprintKey(key, now),
      tasks: grouped.get(key)!,
    }))

    const unassigned = grouped.get(null)
    if (unassigned?.length) {
      result.push({ sprint: null, sprintLabel: undefined, tasks: unassigned })
    }

    return result
  })
}
