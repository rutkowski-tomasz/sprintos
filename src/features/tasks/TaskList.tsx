import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { TaskRow } from './TaskRow'
import { isSnoozed } from '@/features/properties/snooze/snoozeDef'
import { TaskStatus, type Goal, type Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
}

const STATUS_RANK: Record<TaskStatus, number> = {
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.NEXT]: 1,
  [TaskStatus.TODO]: 2,
  [TaskStatus.DONE]: 3,
  [TaskStatus.ARCHIVED]: 4,
}

function compareTasks(a: Task, b: Task): number {
  const statusDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status]
  if (statusDiff !== 0) return statusDiff
  if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate)
  if (a.eventDate) return -1
  if (b.eventDate) return 1
  return 0
}

export function TaskList({ tasks }: TaskListProps) {
  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )
  const [showSnoozed, setShowSnoozed] = useState(false)
  const now = useMemo(() => new Date(), [])

  const goalMap = useMemo(() => new Map(goals.map(g => [g.id, g])), [goals])

  const { visibleTasks, snoozedIds } = useMemo(() => {
    const active: Task[] = []
    const snoozed: Task[] = []
    for (const task of tasks) {
      if (isSnoozed(task, now)) snoozed.push(task)
      else active.push(task)
    }
    active.sort(compareTasks)
    snoozed.sort(compareTasks)
    return {
      visibleTasks: showSnoozed ? [...active, ...snoozed] : active,
      snoozedIds: new Set(snoozed.map(t => t.id)),
    }
  }, [tasks, showSnoozed, now])

  if (!tasks.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No tasks.</p>
  }

  return (
    <div className="border-t border-border">
      <AnimatePresence initial={false}>
        {visibleTasks.map(task => {
          const snoozed = snoozedIds.has(task.id)
          return (
            <motion.div
              key={`${task.id}:${snoozed}`}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: snoozed ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              style={{ overflow: 'hidden' }}
            >
              <TaskRow task={task} goalMap={goalMap} now={now} />
            </motion.div>
          )
        })}
      </AnimatePresence>
      {snoozedIds.size > 0 && (
        <button
          onClick={() => setShowSnoozed(v => !v)}
          className="w-full py-3 text-center text-sm text-foreground/70 hover:text-foreground"
        >
          {showSnoozed ? `Hide snoozed tasks (${snoozedIds.size})` : `Show snoozed tasks (${snoozedIds.size})`}
        </button>
      )}
    </div>
  )
}
