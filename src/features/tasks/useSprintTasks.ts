import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { TaskStatus, type Task } from '@/types'

export function useSprintTasks(sprintKey: string): Task[] | undefined {
  return useLiveQuery(async () => {
    const tasks = await db.tasks
      .where('sprint')
      .equals(sprintKey)
      .filter(t => t.deletedAt === null && t.status < TaskStatus.DONE)
      .toArray()

    tasks.sort((a, b) => b.status - a.status)

    return tasks
  }, [sprintKey])
}
