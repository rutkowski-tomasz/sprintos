import { supabase } from './supabase'
import { db, type Gizmo } from './db'

export async function addGizmo(title: string) {
  const gizmo: Gizmo = {
    id: crypto.randomUUID(),
    title,
    created_at: new Date().toISOString(),
  }

  await db.gizmos.add(gizmo)

  if (navigator.onLine) {
    const { error } = await supabase.from('gizmos').insert(gizmo)
    if (error) await db.sync_queue.add({ operation: 'insert', payload: gizmo })
  } else {
    await db.sync_queue.add({ operation: 'insert', payload: gizmo })
  }
}

async function flushQueue() {
  const items = await db.sync_queue.toArray()
  for (const item of items) {
    const { error } = await supabase.from('gizmos').insert(item.payload)
    if (!error) await db.sync_queue.delete(item.id!)
  }
}

async function bootstrap() {
  if (!navigator.onLine) return
  const { data } = await supabase.from('gizmos').select('*')
  if (data) await db.gizmos.bulkPut(data as Gizmo[])
  await flushQueue()
}

export function setupSync() {
  bootstrap()
  window.addEventListener('online', flushQueue)

  const channel = supabase
    .channel('gizmos-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'gizmos' },
      async (payload) => {
        await db.gizmos.put(payload.new as Gizmo)
      }
    )
    .subscribe()

  return () => {
    window.removeEventListener('online', flushQueue)
    channel.unsubscribe()
  }
}
