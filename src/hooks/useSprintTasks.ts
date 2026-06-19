import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { classifySprints, type SprintLabel } from '@/lib/sprintEngine'
import { TaskStatus, type Sprint, type Task } from '@/types'

const STATUS_ORDER: Record<number, number> = {
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.NEXT]: 1,
  [TaskStatus.TODO]: 2,
}

export interface SprintTasksResult {
  sprint: Sprint | undefined
  tasks: Task[]
}

export function useSprintTasks(label: SprintLabel): SprintTasksResult | undefined {
  return useLiveQuery(async () => {
    const allSprints = await db.sprints.toArray()
    const labels = classifySprints(allSprints, new Date())
    const sprint = allSprints.find(s => labels.get(s.id) === label)

    if (!sprint) return { sprint: undefined, tasks: [] }

    const tasks = await db.tasks
      .where('sprintId')
      .equals(sprint.id)
      .filter(t => t.deletedAt === null && t.status < TaskStatus.DONE)
      .toArray()

    tasks.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

    return { sprint, tasks }
  }, [label])
}
