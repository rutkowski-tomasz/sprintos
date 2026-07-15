import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { TaskRow } from './TaskRow'
import { isSnoozed } from '@/features/properties/snooze/snoozeDef'
import type { Goal, Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )
  const [showSnoozed, setShowSnoozed] = useState(false)

  const goalMap = useMemo(() => new Map(goals.map(g => [g.id, g])), [goals])

  const { visibleTasks, snoozedIds } = useMemo(() => {
    const now = new Date()
    const active: Task[] = []
    const snoozed: Task[] = []
    for (const task of tasks) {
      if (isSnoozed(task, now)) snoozed.push(task)
      else active.push(task)
    }
    return {
      visibleTasks: showSnoozed ? [...active, ...snoozed] : active,
      snoozedIds: new Set(snoozed.map(t => t.id)),
    }
  }, [tasks, showSnoozed])

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
              <TaskRow task={task} goalMap={goalMap} />
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
