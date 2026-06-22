import { useState } from 'react'
import { motion } from 'motion/react'
import { FileText } from 'lucide-react'
import { TaskStatus, type Task } from '@/types'
import { formatDate } from '@/lib/formatters'
import { updateTask } from '@/lib/taskActions'

const STATUS_DOT: Record<number, string> = {
  0: 'bg-zinc-400',
  1: 'bg-purple-500',
  2: 'bg-blue-500',
  3: 'bg-emerald-500',
  4: 'bg-emerald-400/50',
}

const STATUS_BG: Record<number, string> = {
  0: '',
  1: 'bg-purple-500/[0.05]',
  2: 'bg-blue-500/[0.05]',
  3: 'bg-emerald-500/[0.05]',
  4: 'bg-emerald-500/[0.03]',
}

const STATUS_LABEL: Record<number, string> = {
  [TaskStatus.TODO]: 'To-Do',
  [TaskStatus.NEXT]: 'Next',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.ARCHIVED]: 'Archived',
}

function toDateInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface TaskRowProps {
  task: Task
}

export function TaskRow({ task }: TaskRowProps) {
  const [editingField, setEditingField] = useState<'title' | 'date' | null>(null)

  function saveTitle(value: string) {
    const trimmed = value.trim()
    if (trimmed && trimmed !== task.name) {
      updateTask(task.id, { name: trimmed })
    }
  }

  function saveDate(value: string) {
    const date = value ? new Date(value).toISOString() : null
    if (date !== task.eventDate) {
      updateTask(task.id, { eventDate: date })
    }
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.18, ease: 'easeInOut' } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-md overflow-hidden transition-colors ${STATUS_BG[task.status]}`}
    >
      <div className="relative shrink-0">
        <span className={`block w-2 h-2 rounded-full transition-colors duration-300 ${STATUS_DOT[task.status]}`} />
        <select
          value={task.status}
          onChange={e => updateTask(task.id, { status: Number(e.target.value) as TaskStatus })}
          className="absolute -inset-1.5 opacity-0 cursor-pointer"
          aria-label="Task status"
        >
          {Object.entries(STATUS_LABEL).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {task.emoji && <span className="shrink-0 leading-none">{task.emoji}</span>}

      {editingField === 'title' ? (
        <input
          autoFocus
          defaultValue={task.name}
          onBlur={e => { saveTitle(e.target.value); setEditingField(null) }}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') { e.currentTarget.value = task.name; e.currentTarget.blur() }
          }}
          className="flex-1 min-w-0 text-sm bg-transparent outline-none border-b border-border"
        />
      ) : (
        <span
          className="flex-1 text-sm leading-snug truncate cursor-text"
          onClick={() => setEditingField('title')}
        >
          {task.name}
        </span>
      )}

      {editingField === 'date' ? (
        <input
          type="datetime-local"
          autoFocus
          defaultValue={task.eventDate ? toDateInput(task.eventDate) : ''}
          onBlur={e => { saveDate(e.target.value); setEditingField(null) }}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              e.currentTarget.value = task.eventDate ? toDateInput(task.eventDate) : ''
              e.currentTarget.blur()
            }
          }}
          className="text-xs bg-transparent outline-none shrink-0 w-40 text-muted-foreground"
        />
      ) : task.eventDate ? (
        <span
          className="text-xs text-muted-foreground/60 shrink-0 cursor-pointer hover:text-muted-foreground transition-colors"
          onClick={() => setEditingField('date')}
        >
          {formatDate(task.eventDate)}
        </span>
      ) : (
        <span
          className="text-xs text-transparent group-hover:text-muted-foreground/30 shrink-0 cursor-pointer hover:!text-muted-foreground/60 transition-colors select-none"
          onClick={() => setEditingField('date')}
        >
          +
        </span>
      )}

      {task.description && (
        <FileText size={13} className="shrink-0 text-muted-foreground/40" />
      )}
    </motion.div>
  )
}
