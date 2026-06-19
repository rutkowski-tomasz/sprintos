import { supabase } from '@/lib/supabase'
import { db, type TestTask } from '@/lib/db'

async function flushQueue() {
  const items = await db.sync_queue.toArray()
  for (const item of items) {
    const { error } = await supabase.from(item.table).insert(item.payload)
    if (!error) await db.sync_queue.delete(item.id!)
  }
}

async function bootstrap() {
  if (!navigator.onLine) return
  const { data } = await supabase.from('test_tasks').select('*')
  if (data) await db.test_tasks.bulkPut(data as TestTask[])
  await flushQueue()
}

export function setupSync() {
  bootstrap()
  window.addEventListener('online', flushQueue)

  const channel = supabase
    .channel('test_tasks_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'test_tasks' },
      async (payload) => {
        await db.test_tasks.put(payload.new as TestTask)
      }
    )
    .subscribe()

  return () => {
    window.removeEventListener('online', flushQueue)
    channel.unsubscribe()
  }
}

export async function addTask(title: string) {
  const task: TestTask = {
    id: crypto.randomUUID(),
    title,
    created_at: new Date().toISOString(),
  }

  await db.test_tasks.add(task)

  if (navigator.onLine) {
    const { error } = await supabase.from('test_tasks').insert(task)
    if (error) await db.sync_queue.add({ operation: 'insert', table: 'test_tasks', payload: task })
  } else {
    await db.sync_queue.add({ operation: 'insert', table: 'test_tasks', payload: task })
  }
}
