import { supabase } from '@/lib/supabase'
import { db, type TestTask } from '@/lib/db'

async function flushQueue() {
  const items = await db.sync_queue.toArray()
  for (const item of items) {
    const { error } = await supabase.from(item.table).insert(item.payload)
    if (!error) await db.sync_queue.delete(item.id!)
  }
}

export function setupSync() {
  window.addEventListener('online', flushQueue)
  return () => window.removeEventListener('online', flushQueue)
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
