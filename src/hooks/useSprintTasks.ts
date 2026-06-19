import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { sprintKey, sprintKeyOffset, type SprintLabel } from '@/lib/sprintEngine'
import { TaskStatus, type Task } from '@/types'

const STATUS_ORDER: Record<number, number> = {
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.NEXT]: 1,
  [TaskStatus.TODO]: 2,
}

function keyForLabel(label: SprintLabel, now: Date): string | null {
  if (label === 'current') return sprintKey(now)
  if (label === 'next') return sprintKeyOffset(now, 1)
  if (label === 'previous') return sprintKeyOffset(now, -1)
  return null
}

export interface SprintTasksResult {
  sprintKey: string | undefined
  tasks: Task[]
}

export function useSprintTasks(label: SprintLabel): SprintTasksResult | undefined {
  return useLiveQuery(async () => {
    const now = new Date()
    const key = keyForLabel(label, now)

    if (!key) return { sprintKey: undefined, tasks: [] }

    const tasks = await db.tasks
      .where('sprint')
      .equals(key)
      .filter(t => t.deletedAt === null && t.status < TaskStatus.DONE)
      .toArray()

    tasks.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

    return { sprintKey: key, tasks }
  }, [label])
}
