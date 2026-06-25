import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { syncFlushState } from './syncStatus'

export type SyncStatus = 'synced' | 'sending' | 'queued'

export function useSyncStatus(): SyncStatus {
  const [isFlushing, setIsFlushing] = useState(syncFlushState.isFlushing)
  const queueCount = useLiveQuery(() => db.sync_queue.count(), [], 0)

  useEffect(() => {
    return syncFlushState.subscribe(() => setIsFlushing(syncFlushState.isFlushing))
  }, [])

  if (isFlushing) return 'sending'
  if ((queueCount ?? 0) > 0) return 'queued'
  return 'synced'
}
