import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { flushQueue } from '@/lib/sync'
import { parseTaskInput } from '@/lib/parser'
import { sprintKey, sprintKeyOffset } from '@/lib/sprintEngine'
import { useSession } from '@/hooks/useSession'
import { TaskStatus, type Goal, type Task } from '@/types'

function sprintForPath(pathname: string): string | null {
  const now = new Date()
  if (pathname === '/current') return sprintKey(now)
  if (pathname === '/next') return sprintKeyOffset(now, 1)
  return null
}

export function useTaskCreator(value: string) {
  const { pathname } = useLocation()
  const { session } = useSession()

  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )

  const sprint = sprintForPath(pathname)
  const parsed = useMemo(() => parseTaskInput(value, goals), [value, goals])

  async function submit(): Promise<boolean> {
    if (!value.trim() || !session) return false

    const now = new Date().toISOString()
    const task: Task = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      sprint,
      goalId: parsed.goalId,
      name: parsed.name || 'Untitled',
      emoji: parsed.emoji,
      status: parsed.status ?? TaskStatus.TODO,
      eventDate: parsed.eventDate,
      snooze: parsed.snooze,
      description: null,
      sourceUrl: parsed.sourceUrl,
      duration: parsed.duration,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }

    await db.tasks.add(task)
    await db.sync_queue.add({
      operation: 'insert',
      table: 'tasks',
      payload: task as unknown as Record<string, unknown>,
    })
    flushQueue()
    return true
  }

  return { submit, parsed, goals }
}
