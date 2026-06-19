import { supabase } from '@/lib/supabase'
import { db, type TestTask } from '@/lib/db'

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
