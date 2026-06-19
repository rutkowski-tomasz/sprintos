import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { parseTaskInput } from '@/lib/parser'
import { tokenizeInput, type TokenType } from '@/lib/taskTokenizer'
import { formatDate, formatDuration, formatSnooze } from '@/lib/formatters'
import { useSession } from '@/hooks/useSession'
import { TaskStatus, type Goal, type Task } from '@/types'

const TOKEN_COLOR: Record<TokenType, string> = {
  name: '',
  emoji: 'text-emerald-500',
  url: 'text-blue-500',
  status: 'text-amber-500',
  snooze: 'text-indigo-500',
  duration: 'text-cyan-500',
  goal: 'text-rose-500',
}

const BADGE_STYLE: Record<string, string> = {
  emoji:    'bg-emerald-500/10 text-emerald-400',
  status:   'bg-amber-500/10   text-amber-400',
  date:     'bg-orange-500/10  text-orange-400',
  snooze:   'bg-indigo-500/10  text-indigo-400',
  duration: 'bg-cyan-500/10    text-cyan-400',
  goal:     'bg-rose-500/10    text-rose-400',
  url:      'bg-blue-500/10    text-blue-400',
}

const STATUS_LABEL: Record<number, string> = {
  [TaskStatus.TODO]: 'To-Do',
  [TaskStatus.NEXT]: 'Next',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.ARCHIVED]: 'Archived',
}

interface TaskInputProps {
  sprint: string | null
}

export function TaskInput({ sprint }: TaskInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const { session } = useSession()

  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )

  const parsed = useMemo(() => parseTaskInput(value, goals), [value, goals])
  const segments = useMemo(() => tokenizeInput(value), [value])

  async function handleSubmit() {
    if (!value.trim() || !session) return

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

    setValue('')
    inputRef.current?.focus()
  }

  function handleScroll() {
    if (mirrorRef.current && inputRef.current) {
      mirrorRef.current.scrollLeft = inputRef.current.scrollLeft
    }
  }

  const badges: { key: string; label: string; style: string }[] = []
  if (parsed.emoji)           badges.push({ key: 'emoji',    label: parsed.emoji,                    style: BADGE_STYLE.emoji })
  if (parsed.status !== null) badges.push({ key: 'status',   label: STATUS_LABEL[parsed.status],     style: BADGE_STYLE.status })
  if (parsed.eventDate)       badges.push({ key: 'date',     label: formatDate(parsed.eventDate),    style: BADGE_STYLE.date })
  if (parsed.snooze)          badges.push({ key: 'snooze',   label: formatSnooze(parsed.snooze),     style: BADGE_STYLE.snooze })
  if (parsed.duration)        badges.push({ key: 'duration', label: formatDuration(parsed.duration), style: BADGE_STYLE.duration })
  if (parsed.sourceUrl)       badges.push({ key: 'url',      label: 'URL',                           style: BADGE_STYLE.url })
  if (parsed.goalId) {
    const goal = goals.find(g => g.id === parsed.goalId)
    if (goal) badges.push({ key: 'goal', label: `#${goal.name}`, style: BADGE_STYLE.goal })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-10 rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring overflow-hidden">
        <div
          ref={mirrorRef}
          className="absolute inset-0 flex items-center px-3 overflow-hidden pointer-events-none"
          aria-hidden
        >
          <span className="whitespace-pre text-sm">
            {segments.map((seg, i) => (
              <span key={i} className={TOKEN_COLOR[seg.type]}>{seg.text}</span>
            ))}
          </span>
        </div>

        {!value && (
          <span className="absolute inset-0 flex items-center px-3 text-sm text-muted-foreground/40 pointer-events-none">
            Add a task…
          </span>
        )}

        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
          onScroll={handleScroll}
          className="absolute inset-0 w-full px-3 bg-transparent text-transparent text-sm outline-none font-sans"
          style={{ caretColor: 'var(--foreground)' }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1 px-0.5">
          {badges.map(b => (
            <span key={b.key} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${b.style}`}>
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
