import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { db } from '@/lib/db'
import { TaskStatus, type Task } from '@/types'
import { TaskResultRow } from './TaskResultRow'
import type { ParseResult } from './taskInputParser'
import { CommandSuggestion } from './CommandSuggestion'
import type { SuggestionItem } from './CommandSuggestion'
import { sprintKey, sprintKeyOffset, formatSprintKey } from '@/features/properties/sprint/sprintDef'
import { PropertyChip } from '@/features/properties/PropertyChip'
import { CHIP_ORDER, type ChipProperty } from '@/features/properties/registry'
import { Chip } from '@/features/properties/Chip'

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

const CHIP_SOURCES: Record<ChipProperty, {
  fromTask: (t: Task) => string | number | null
  fromParsed: (p: ParseResult) => string | number | null
  emptyLabel: string
}> = {
  eventDate: { fromTask: t => t.eventDate, fromParsed: p => p.eventDate?.value ?? null, emptyLabel: 'No date' },
  duration: { fromTask: t => t.duration, fromParsed: p => p.duration?.value ?? null, emptyLabel: 'No duration' },
}

function buildTaskChips(task: Task): ReactNode[] {
  return CHIP_ORDER.flatMap(key => {
    const value = CHIP_SOURCES[key].fromTask(task)
    return value ? [<PropertyChip key={key} property={key} value={value as never} />] : []
  })
}

function buildPreviewChips(parsed: ParseResult): ReactNode[] {
  return CHIP_ORDER.map(key => {
    const value = CHIP_SOURCES[key].fromParsed(parsed)
    return value != null
      ? <PropertyChip key={key} property={key} value={value as never} />
      : <Chip key={key}>{CHIP_SOURCES[key].emptyLabel}</Chip>
  })
}

function taskSubtitle(task: Task): string {
  const parts: string[] = []
  if (task.sprint) parts.push(`Sprint ${formatSprintKey(task.sprint, new Date())}`)
  parts.push(timeAgo(task.updatedAt))
  return parts.join(' · ')
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
                <TaskResultRow
                  emoji={task.emoji ?? undefined}
                  name={task.name}
                  subtitle={taskSubtitle(task)}
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
          <TaskResultRow
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
