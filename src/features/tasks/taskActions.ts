import { db } from '@/lib/db'
import { flushQueue } from '@/features/sync/sync'
import { embed } from '@/lib/embedder'
import { TaskStatus, type Task } from '@/types'

export async function addTask(fields: Pick<Task, 'userId' | 'sprint' | 'goalId' | 'name' | 'emoji' | 'status' | 'eventDate' | 'snooze' | 'sourceUrl' | 'duration'>): Promise<void> {
  const now = new Date().toISOString()
  const task: Task = {
    ...fields,
    id: crypto.randomUUID(),
    status: fields.status ?? TaskStatus.TODO,
    description: null,
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    embedding: await embed(fields.name),
  }
  await db.tasks.add(task)
  await db.sync_queue.add({ operation: 'insert', table: 'tasks', payload: task })
  flushQueue()
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const task = await db.tasks.get(id)
  if (!task) return
  if (patch.name !== undefined && patch.name !== task.name) {
    patch = { ...patch, embedding: await embed(patch.name) }
  }
  const updated: Task = { ...task, ...patch, updatedAt: new Date().toISOString(), version: task.version + 1 }
  await db.tasks.put(updated)
  await db.sync_queue.add({
    operation: 'update',
    table: 'tasks',
    payload: updated,
  })
  flushQueue()
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id)
  await db.sync_queue.add({
    operation: 'delete',
    table: 'tasks',
    payload: { id },
  })
  flushQueue()
}

export async function findSimilarTask(query: string): Promise<Task | null> {
  const vec = await embed(query)
  const tasks = await db.tasks.filter(t => t.deletedAt === null && t.embedding != null).toArray()
  let best: Task | null = null
  let bestScore = -Infinity
  for (const task of tasks) {
    let dot = 0
    for (let i = 0; i < vec.length; i++) dot += vec[i] * task.embedding![i]
    if (dot > bestScore) { bestScore = dot; best = task }
  }
  return best
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
    payload: copy,
  })
  flushQueue()
}
