import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Goal, Sprint, Task } from '@/types'

async function flushQueue() {
  const items = await db.sync_queue.toArray()
  for (const item of items) {
    let result
    if (item.operation === 'insert') {
      result = await supabase.from(item.table).insert(item.payload)
    } else if (item.operation === 'update') {
      result = await supabase.from(item.table).update(item.payload).eq('id', item.payload['id'])
    } else if (item.operation === 'delete') {
      result = await supabase.from(item.table).delete().eq('id', item.payload['id'])
    }
    if (result && !result.error) await db.sync_queue.delete(item.id!)
  }
}

async function bootstrap() {
  if (!navigator.onLine) return

  const [{ data: goals }, { data: sprints }, { data: tasks }] = await Promise.all([
    supabase.from('goals').select('*'),
    supabase.from('sprints').select('*'),
    supabase.from('tasks').select('*'),
  ])

  if (goals) await db.goals.bulkPut(goals as Goal[])
  if (sprints) await db.sprints.bulkPut(sprints as Sprint[])
  if (tasks) await db.tasks.bulkPut(tasks as Task[])

  await flushQueue()
}

export function setupSync() {
  bootstrap()
  window.addEventListener('online', flushQueue)

  const channel = supabase
    .channel('db_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, async (payload) => {
      if (payload.eventType === 'DELETE') await db.goals.delete((payload.old as Goal).id)
      else await db.goals.put(payload.new as Goal)
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sprints' }, async (payload) => {
      if (payload.eventType === 'DELETE') await db.sprints.delete((payload.old as Sprint).id)
      else await db.sprints.put(payload.new as Sprint)
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async (payload) => {
      if (payload.eventType === 'DELETE') await db.tasks.delete((payload.old as Task).id)
      else await db.tasks.put(payload.new as Task)
    })
    .subscribe()

  return () => {
    window.removeEventListener('online', flushQueue)
    channel.unsubscribe()
  }
}
