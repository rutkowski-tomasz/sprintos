import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { TaskRow } from './TaskRow'
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

  const goalMap = useMemo(() => new Map(goals.map(g => [g.id, g])), [goals])

  if (!tasks.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No tasks.</p>
  }

  return (
    <div className="border-t border-border">
      <AnimatePresence initial={false}>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            style={{ overflow: 'hidden' }}
          >
            <TaskRow task={task} goalMap={goalMap} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
