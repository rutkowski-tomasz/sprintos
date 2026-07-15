import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'motion/react'
import { db } from '@/lib/db'
import type { Task } from '@/types'
import { TaskResultRow } from './TaskResultRow'
import { buildTaskChips } from './taskChips'
import { SprintChip } from '@/features/properties/sprint/SprintChip'

interface MatchingTasksPanelProps {
  inputValue: string
  onCopy: (text: string) => void
  onOpen: (task: Task) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86_400_000)
  return `${days}d ago`
}

function taskSubtitle(task: Task): ReactNode {
  return (
    <span className="flex items-center gap-1.5">
      <SprintChip sprint={task.sprint} now={new Date()} />
      <span>{timeAgo(task.updatedAt)}</span>
    </span>
  )
}

const ROW_ANIM = { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, transition: { type: 'spring' as const, stiffness: 420, damping: 36 } }

export function MatchingTasksPanel({ inputValue, onCopy, onOpen }: MatchingTasksPanelProps) {
  const tasks = useLiveQuery(async () => {
    const all = await db.tasks.filter(t => t.deletedAt === null).toArray()
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const q = inputValue.trim().toLowerCase()
    if (!q) return all.slice(0, 20)
    return all.filter(t => t.name.toLowerCase().includes(q)).slice(0, 20)
  }, [inputValue])

  const label = inputValue.trim() ? 'Matching Tasks' : 'Recent Tasks'

  return (
    <motion.div
      className="bn-results-page absolute inset-0 z-10 bg-background overflow-y-auto overscroll-contain"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div className="pb-safe-nav">
        <p className="px-4 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
          {label}
        </p>
        {tasks && tasks.length > 0 ? (
          <AnimatePresence initial={false}>
            {tasks.map(task => (
              <motion.div key={task.id} {...ROW_ANIM}>
                <TaskResultRow
                  emoji={task.emoji ?? undefined}
                  name={task.name}
                  subtitle={taskSubtitle(task)}
                  status={task.status}
                  chips={buildTaskChips(task)}
                  onCopy={onCopy}
                  onOpen={() => onOpen(task)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <p className="px-4 py-6 text-sm text-white/35">No tasks found.</p>
        )}
      </div>
    </motion.div>
  )
}
