import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { db } from '@/lib/db'
import { TaskStatus } from '@/types'
import { TaskRow } from './TaskRow'
import type { ParseResult } from './taskInputParser'
import { sprintKey, sprintKeyOffset, formatSprintKey } from '@/features/properties/sprints/sprintEngine'

interface CommandResultsProps {
  inputValue: string
  parsed: ParseResult | null
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

function sprintLabelForPath(pathname: string): string | null {
  const now = new Date()
  if (pathname === '/current') return `Sprint ${formatSprintKey(sprintKey(now), now)}`
  if (pathname === '/next') return `Sprint ${formatSprintKey(sprintKeyOffset(now, 1), now)}`
  if (pathname === '/backlog') return 'Backlog'
  return null
}

export function CommandResults({ inputValue, parsed, onCopy }: CommandResultsProps) {
  const location = useLocation()

  const tasks = useLiveQuery(async () => {
    const all = await db.tasks.filter(t => t.deletedAt === null).toArray()
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const q = inputValue.trim().toLowerCase()
    if (!q) return all.slice(0, 5)
    return all.filter(t => t.name.toLowerCase().includes(q)).slice(0, 5)
  }, [inputValue])

  if (!tasks?.length && !parsed) return null

  return (
    <motion.div
      className="bn-suggestions rounded-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
    >
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
        Results
      </p>
      {tasks?.map(task => (
        <TaskRow
          key={task.id}
          emoji={task.emoji ?? undefined}
          name={task.name}
          subtitle={timeAgo(task.updatedAt)}
          status={task.status}
          onCopy={onCopy}
        />
      ))}
      {parsed && (
        <>
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            Task Preview
          </p>
          <TaskRow
            emoji={parsed.emoji?.value ?? undefined}
            name={parsed.title || 'Untitled'}
            subtitle={sprintLabelForPath(location.pathname) ?? undefined}
            status={parsed.status?.value ?? TaskStatus.TODO}
            isPreview
          />
        </>
      )}
    </motion.div>
  )
}
