import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

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
  await flushQueue()
}

export function setupSync() {
  bootstrap()
  window.addEventListener('online', flushQueue)

  return () => {
    window.removeEventListener('online', flushQueue)
  }
}
