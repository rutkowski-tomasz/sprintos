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

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id)
  await db.sync_queue.add({
    operation: 'delete',
    table: 'tasks',
    payload: { id },
  })
}

export async function duplicateTask(id: string): Promise<void> {
  const task = await db.tasks.get(id)
  if (!task) return
  const all = await db.tasks.filter(t => t.deletedAt === null).toArray()
  const names = new Set(all.map(t => t.name))
  let n = 1
  let newName = `${task.name} ${n}`
  while (names.has(newName)) newName = `${task.name} ${++n}`
  const now = new Date().toISOString()
  const copy: Task = { ...task, id: crypto.randomUUID(), name: newName, createdAt: now, updatedAt: now, version: 1 }
  await db.tasks.put(copy)
  await db.sync_queue.add({
    operation: 'insert',
    table: 'tasks',
    payload: copy as unknown as Record<string, unknown>,
  })
}
