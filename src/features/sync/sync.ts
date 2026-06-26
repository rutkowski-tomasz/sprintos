import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { sprintKey, compareSprintKeys } from '@/features/properties/sprint/sprintDef'
import { syncFlushState } from './syncStatus'
import { TaskStatus, type Goal, type Task } from '@/types'

async function rollover(now: Date) {
  const currentKey = sprintKey(now)
  const staleTasks = await db.tasks
    .filter(
      t =>
        t.deletedAt === null &&
        t.status < TaskStatus.DONE &&
        t.sprint !== null &&
        compareSprintKeys(t.sprint, currentKey) < 0,
    )
    .toArray()

  if (staleTasks.length === 0) return

  const ts = now.toISOString()
  for (const task of staleTasks) {
    const updated = { ...task, sprint: currentKey, updatedAt: ts }
    await db.tasks.put(updated)
    await db.sync_queue.add({ operation: 'update', table: 'tasks', payload: updated })
  }
}

let flushPending = false

export async function flushQueue() {
  if (syncFlushState.isFlushing) {
    flushPending = true
    return
  }
  syncFlushState.setFlushing(true)
  flushPending = false
  try {
    const items = await db.sync_queue.toArray()
    for (const item of items) {
      let result
      if (item.operation === 'insert') {
        result = await supabase.from(item.table).insert(item.payload)
      } else if (item.operation === 'update') {
        const p = item.payload as { id: string }
        result = await supabase.from(item.table).update(item.payload).eq('id', p.id)
      } else if (item.operation === 'delete') {
        const p = item.payload as { id: string }
        result = await supabase.from(item.table).delete().eq('id', p.id)
      }
      if (result && !result.error) await db.sync_queue.delete(item.id!)
    }
  } finally {
    syncFlushState.setFlushing(false)
    if (flushPending) flushQueue()
  }
}

function deserializeTask(raw: Record<string, unknown>): Task {
  const embedding = raw.embedding
  return {
    ...raw,
    embedding: embedding ? JSON.parse(embedding as string) : null,
  } as Task
}

async function bootstrap() {
  if (!navigator.onLine) return

  const [{ data: goals }, { data: tasks }] = await Promise.all([
    supabase.from('goals').select('*'),
    supabase.from('tasks').select('*'),
  ])

  if (goals) await db.goals.bulkPut(goals as Goal[])
  if (tasks) await db.tasks.bulkPut(tasks.map(deserializeTask))

  await flushQueue()
}

export function setupSync() {
  rollover(new Date())
  bootstrap()
  window.addEventListener('online', flushQueue)

  const channel = supabase
    .channel('db_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, async (payload) => {
      if (payload.eventType === 'DELETE') await db.goals.delete((payload.old as Goal).id)
      else await db.goals.put(payload.new as Goal)
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async (payload) => {
      if (payload.eventType === 'DELETE') await db.tasks.delete((payload.old as Task).id)
      else await db.tasks.put(deserializeTask(payload.new as Record<string, unknown>))
    })
    .subscribe()

  return () => {
    window.removeEventListener('online', flushQueue)
    channel.unsubscribe()
  }
}
