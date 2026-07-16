import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

let intentional = false

export function consumeIntentionalSignOut(): boolean {
  const value = intentional
  intentional = false
  return value
}

export function pendingSyncCount(): Promise<number> {
  return db.sync_queue.count()
}

export async function signOut() {
  intentional = true
  await supabase.auth.signOut()
}
