import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, useMotionValue, animate, useDragControls, type PanInfo } from 'motion/react'
import { ArrowLeft, ExternalLink, Copy, ClipboardCopy, Trash2, MoreVertical, X, Split } from 'lucide-react'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { StatusPicker } from '@/features/properties/status/StatusPicker'
import { SprintPicker } from '@/features/properties/sprint/SprintPicker'
import { SnoozeChip } from '@/features/properties/snooze/SnoozeChip'
import { RescheduleSheet } from '@/features/properties/snooze/RescheduleSheet'
import { isSnoozed } from '@/features/properties/snooze/snoozeDef'
import { formatDuration, durationParser } from '@/features/properties/duration/durationDef'
import { splitLeadingEmoji } from '@/features/properties/emoji/emojiDef'
import { updateTask, duplicateTask, deleteTask, createSeries } from './taskActions'
import type { Task } from '@/types'

const BACK_OFFSET_THRESHOLD = 100
const BACK_VELOCITY_THRESHOLD = 500
const EDGE_ZONE_WIDTH = 24
const SPRING = { type: 'spring', stiffness: 420, damping: 40 } as const

interface TaskDetailPageProps {
  taskId: string
  now: Date
  listPath: string
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseDurationText(text: string, now: Date): number | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const hit = durationParser.parse([{ text: trimmed, start: 0, end: trimmed.length }], { now })
  return hit ? (hit.value as number) : null
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center justify-end gap-1.5 min-w-0">{children}</div>
    </div>
  )
}

function EmptyValue({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors">
      Empty
    </button>
  )
}

function TaskDetailForm({ task, now }: { task: Task; now: Date }) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [name, setName] = useState(task.name)
  const nameRef = useRef<HTMLTextAreaElement>(null)
  const [emoji, setEmoji] = useState(task.emoji ?? '')
  const [description, setDescription] = useState(task.description ?? '')
  const [sourceUrl, setSourceUrl] = useState(task.sourceUrl ?? '')
  const [editingUrl, setEditingUrl] = useState(false)
  const [durationText, setDurationText] = useState(task.duration ? formatDuration(task.duration) : '')
  const [editingDuration, setEditingDuration] = useState(false)
  const [eventDateLocal, setEventDateLocal] = useState(task.eventDate ? toDatetimeLocal(task.eventDate) : '')
  const [editingDate, setEditingDate] = useState(false)

  const goal = useLiveQuery(() => task.goalId ? db.goals.get(task.goalId) : undefined, [task.goalId])
  const goalText = goal ? (goal.emoji ? `${goal.emoji} ${goal.name}` : goal.name) : null

  function saveName() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== task.name) void updateTask(task.id, { name: trimmed })
    else setName(task.name)
  }

  function resizeNameInput(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    if (nameRef.current) resizeNameInput(nameRef.current)
  }, [name])

  function saveEmoji() {
    const trimmed = emoji.trim()
    const { emoji: leading, rest } = splitLeadingEmoji(trimmed)
    if (!leading) {
      if (trimmed !== (task.emoji ?? '')) void updateTask(task.id, { emoji: trimmed || null })
      return
    }
    setEmoji(leading)
    if (leading !== (task.emoji ?? '')) void updateTask(task.id, { emoji: leading })
    const overflow = rest.trim()
    if (overflow) {
      const newName = `${overflow} ${task.name}`.trim()
      setName(newName)
      void updateTask(task.id, { name: newName })
    }
  }

  function saveDescription() {
    if (description !== (task.description ?? '')) void updateTask(task.id, { description: description || null })
  }

  function saveSourceUrl() {
    const trimmed = sourceUrl.trim()
    if (trimmed !== (task.sourceUrl ?? '')) void updateTask(task.id, { sourceUrl: trimmed || null })
    setEditingUrl(false)
  }

  function saveDuration() {
    const seconds = parseDurationText(durationText, now)
    if (seconds !== task.duration) void updateTask(task.id, { duration: seconds })
    setDurationText(seconds ? formatDuration(seconds) : '')
    setEditingDuration(false)
  }

  function saveEventDate() {
    const iso = eventDateLocal ? new Date(eventDateLocal).toISOString() : null
    if (iso !== task.eventDate) void updateTask(task.id, { eventDate: iso })
    setEditingDate(false)
  }

  function clearEventDate() {
    setEventDateLocal('')
    setEditingDate(false)
    if (task.eventDate !== null) void updateTask(task.id, { eventDate: null })
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          onBlur={saveEmoji}
          className="h-8 w-8 shrink-0 text-center text-lg bg-transparent border-0 outline-none rounded hover:bg-muted/40 focus:bg-muted/40 transition-colors"
          placeholder="—"
        />
        <textarea
          ref={nameRef}
          rows={1}
          value={name}
          onChange={e => {
            setName(e.target.value)
            resizeNameInput(e.target)
          }}
          onBlur={saveName}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          className="flex-1 min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words text-lg font-semibold leading-snug bg-transparent border-0 outline-none rounded px-1 -mx-1 py-1 hover:bg-muted/40 focus:bg-muted/40 transition-colors"
        />
      </div>

      <div className="flex flex-col divide-y divide-border border-t border-border shrink-0">
        <Field label="Status">
          <StatusPicker task={task} />
        </Field>

        <Field label="Sprint">
          <SprintPicker task={task} />
        </Field>

        <Field label="Event date">
          {editingDate || eventDateLocal ? (
            <>
              <input
                type="datetime-local"
                autoFocus={editingDate}
                value={eventDateLocal}
                onChange={e => setEventDateLocal(e.target.value)}
                onBlur={saveEventDate}
                className="bg-transparent border-0 outline-none text-sm text-right"
              />
              <button
                onClick={clearEventDate}
                aria-label="Clear event date"
                className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <EmptyValue onClick={() => setEditingDate(true)} />
          )}
        </Field>

        <Field label="Snooze">
          <button
            onClick={() => setRescheduleOpen(true)}
            className="flex items-center gap-2 text-right text-sm hover:text-foreground"
          >
            {isSnoozed(task, now) ? <SnoozeChip task={task} now={now} /> : <span className="text-muted-foreground/40">Empty</span>}
          </button>
        </Field>

        <Field label="Duration">
          {editingDuration ? (
            <input
              autoFocus
              value={durationText}
              onChange={e => setDurationText(e.target.value)}
              onBlur={saveDuration}
              placeholder="e.g. 1h30m"
              className="bg-transparent border-0 outline-none text-sm text-right w-24"
            />
          ) : task.duration ? (
            <button onClick={() => setEditingDuration(true)} className="text-sm hover:text-foreground">
              {formatDuration(task.duration)}
            </button>
          ) : (
            <EmptyValue onClick={() => setEditingDuration(true)} />
          )}
        </Field>

        {goalText && (
          <Field label="Goal">
            <Badge variant="outline">{goalText}</Badge>
          </Field>
        )}

        <Field label="Link">
          {editingUrl ? (
            <input
              autoFocus
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              onBlur={saveSourceUrl}
              placeholder="https://…"
              className="bg-transparent border-0 outline-none text-sm text-right flex-1 min-w-0"
            />
          ) : task.sourceUrl ? (
            <div className="flex items-center gap-1 min-w-0">
              <button
                onClick={() => setEditingUrl(true)}
                className="truncate max-w-[160px] text-sm hover:text-foreground"
              >
                {task.sourceUrl}
              </button>
              <button
                onClick={() => void navigator.clipboard.writeText(task.sourceUrl ?? '')}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Copy size={14} />
              </button>
              <a
                href={task.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <EmptyValue onClick={() => setEditingUrl(true)} />
          )}
        </Field>
      </div>

      <div className="flex-1 min-h-0 flex flex-col border-t border-border">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder="Add a description…"
          className="flex-1 min-h-0 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      <RescheduleSheet task={task} open={rescheduleOpen} onOpenChange={setRescheduleOpen} snoozeOnly />
    </div>
  )
}

function SeriesSheet({ task, open, onOpenChange }: { task: Task; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [count, setCount] = useState('4')
  const parsed = parseInt(count, 10)
  const valid = Number.isInteger(parsed) && parsed >= 2

  async function handleCreate() {
    if (!valid) return
    await createSeries(task.id, parsed)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Split into series</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <label className="text-xs text-muted-foreground">Number of parts</label>
          <input
            type="number"
            min={2}
            autoFocus
            value={count}
            onChange={e => setCount(e.target.value)}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
          />
          <Button size="lg" className="w-full" disabled={!valid} onClick={() => void handleCreate()}>
            Split
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function TaskDetailPage({ taskId, now, listPath }: TaskDetailPageProps) {
  const navigate = useNavigate()
  const task = useLiveQuery(() => db.tasks.get(taskId), [taskId])
  const x = useMotionValue(0)
  const dragControls = useDragControls()
  const [seriesOpen, setSeriesOpen] = useState(false)

  function goBack() {
    navigate(listPath)
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > BACK_OFFSET_THRESHOLD || info.velocity.x > BACK_VELOCITY_THRESHOLD) {
      goBack()
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 })
    }
  }

  async function handleDuplicate() {
    if (!task) return
    const newId = await duplicateTask(task.id)
    if (newId) navigate(`${listPath}/${newId}`)
  }

  async function handleCopyContent() {
    if (!task) return
    const parts = [task.emoji ? `${task.emoji} ${task.name}` : task.name]
    if (task.description) parts.push(task.description)
    await navigator.clipboard.writeText(parts.join('\n\n'))
  }

  async function handleDelete() {
    if (!task) return
    if (!window.confirm(`Delete "${task.name}"?`)) return
    await deleteTask(task.id)
    goBack()
  }

  return (
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.6 }}
      onDragEnd={handleDragEnd}
      style={{ x }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={SPRING}
      className="absolute inset-0 z-30 bg-background flex flex-col"
    >
      <div
        className="absolute left-0 top-0 h-full touch-none"
        style={{ width: EDGE_ZONE_WIDTH }}
        onPointerDown={e => dragControls.start(e)}
      />

      <div className="relative z-10 shrink-0 flex items-center px-2 py-2 border-b border-border">
        <Button variant="ghost" size="icon-sm" onClick={goBack}>
          <ArrowLeft />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="ml-auto">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => void handleDuplicate()}>
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleCopyContent()}>
              <ClipboardCopy /> Copy content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSeriesOpen(true)}>
              <Split /> Split into series
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void handleDelete()}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task && <TaskDetailForm task={task} now={now} />}
      {task && <SeriesSheet task={task} open={seriesOpen} onOpenChange={setSeriesOpen} />}
    </motion.div>
  )
}
