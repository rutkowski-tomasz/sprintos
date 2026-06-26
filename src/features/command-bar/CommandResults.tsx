import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { db } from '@/lib/db'
import { TaskStatus, type Task } from '@/types'
import { TaskRow } from './TaskRow'
import type { TaskChip } from './TaskRow'
import type { ParseResult } from './taskInputParser'
import { CommandSuggestion } from './CommandSuggestion'
import type { SuggestionItem } from './CommandSuggestion'
import { sprintKey, sprintKeyOffset, formatSprintKey } from '@/features/properties/sprints/sprintEngine'

interface CommandResultsProps {
  inputValue: string
  parsed: ParseResult | null
  suggestions: SuggestionItem[]
  onCopy: (text: string) => void
  onSubmit: () => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86_400_000)
  return `${days}d ago`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
  if (d.getHours() || d.getMinutes()) {
    opts.hour = 'numeric'
    opts.minute = '2-digit'
  }
  return d.toLocaleDateString('en-US', opts)
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

function buildTaskChips(task: Task): TaskChip[] {
  const chips: TaskChip[] = []
  if (task.eventDate) chips.push({ label: formatDate(task.eventDate), color: '#818cf8' })
  if (task.duration) chips.push({ label: formatDuration(task.duration), color: '#2dd4bf' })
  return chips
}

function buildPreviewChips(parsed: ParseResult): TaskChip[] {
  return [
    parsed.eventDate
      ? { label: formatDate(parsed.eventDate.value), color: '#818cf8' }
      : { label: 'No date' },
    parsed.duration
      ? { label: formatDuration(parsed.duration.value), color: '#2dd4bf' }
      : { label: 'No duration' },
  ]
}

function sprintLabelForPath(pathname: string): string | null {
  const now = new Date()
  if (pathname === '/current') return `Sprint ${formatSprintKey(sprintKey(now), now)}`
  if (pathname === '/next') return `Sprint ${formatSprintKey(sprintKeyOffset(now, 1), now)}`
  if (pathname === '/backlog') return 'Backlog'
  return null
}

const ROW_ANIM = { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, transition: { type: 'spring' as const, stiffness: 420, damping: 36 } }

export function CommandResults({ inputValue, parsed, suggestions, onCopy, onSubmit }: CommandResultsProps) {
  const location = useLocation()

  const tasks = useLiveQuery(async () => {
    const all = await db.tasks.filter(t => t.deletedAt === null).toArray()
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const q = inputValue.trim().toLowerCase()
    if (!q) return all.slice(0, 5)
    return all.filter(t => t.name.toLowerCase().includes(q)).slice(0, 5)
  }, [inputValue])

  if (!tasks?.length && !parsed && !suggestions.length) return null

  const tasksLabel = inputValue.trim() ? 'Matching Tasks' : 'Recent Tasks'

  return (
    <motion.div
      className="bn-suggestions rounded-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
    >
      {tasks && tasks.length > 0 && (
        <>
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            {tasksLabel}
          </p>
          <AnimatePresence initial={false}>
            {tasks.map(task => (
              <motion.div key={task.id} {...ROW_ANIM}>
                <TaskRow
                  emoji={task.emoji ?? undefined}
                  name={task.name}
                  subtitle={timeAgo(task.updatedAt)}
                  status={task.status}
                  chips={buildTaskChips(task)}
                  onCopy={onCopy}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}
      {parsed && (
        <>
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            Task Preview
          </p>
          <TaskRow
            emoji={parsed.emoji?.value ?? undefined}
            name={parsed.title || 'Untitled'}
            subtitle={sprintLabelForPath(location.pathname) ?? undefined}
            status={(parsed.status?.value ?? TaskStatus.TODO) as TaskStatus}
            chips={buildPreviewChips(parsed)}
            isPreview
            onSubmit={onSubmit}
          />
        </>
      )}
      {suggestions.length > 0 && (
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
          Suggestions
        </p>
      )}
      <CommandSuggestion items={suggestions} />
    </motion.div>
  )
}
