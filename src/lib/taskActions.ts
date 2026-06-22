import { db } from '@/lib/db'
import type { Task } from '@/types'

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const task = await db.tasks.get(id)
  if (!task) return
  const updated: Task = { ...task, ...patch, updatedAt: new Date().toISOString(), version: task.version + 1 }
  await db.tasks.put(updated)
  await db.sync_queue.add({
    operation: 'update',
    table: 'tasks',
    payload: updated as unknown as Record<string, unknown>,
  })
}
