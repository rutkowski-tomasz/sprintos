import { useLiveQuery } from 'dexie-react-hooks'
import { Copy } from 'lucide-react'
import { motion } from 'motion/react'
import { db } from '@/lib/db'
import type { Task } from '@/types'
import { STATUS_LABEL, STATUS_BADGE } from '@/features/properties/status/TaskStatus'

interface SuggestionsProps {
  inputValue: string
  onCopy: (text: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86_400_000)
  return `${days}d ago`
}

interface SuggestionRowProps {
  task: Task
  onCopy: (text: string) => void
}

function SuggestionRow({ task, onCopy }: SuggestionRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <span className="text-lg w-6 text-center leading-none shrink-0">{task.emoji ?? ''}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{task.name}</p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">{timeAgo(task.updatedAt)}</p>
      </div>

      <span className={`text-xs px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[task.status]}`}>
        {STATUS_LABEL[task.status]}
      </span>

      <button
        type="button"
        className="shrink-0 p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/50 transition-colors"
        onMouseDown={e => {
          e.preventDefault()
          onCopy(task.name)
        }}
        aria-label="Copy to input"
      >
        <Copy size={13} />
      </button>
    </div>
  )
}

export function Suggestions({ inputValue, onCopy }: SuggestionsProps) {
  const tasks = useLiveQuery(async () => {
    const all = await db.tasks.filter(t => t.deletedAt === null).toArray()
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const q = inputValue.trim().toLowerCase()
    if (!q) return all.slice(0, 5)
    return all.filter(t => t.name.toLowerCase().includes(q)).slice(0, 5)
  }, [inputValue])

  if (!tasks?.length) return null

  return (
    <motion.div
      className="rounded-xl border border-border bg-background overflow-hidden shadow-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
    >
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-muted-foreground/40 uppercase">
        Suggestions
      </p>
      {tasks.map(task => (
        <SuggestionRow key={task.id} task={task} onCopy={onCopy} />
      ))}
    </motion.div>
  )
}
