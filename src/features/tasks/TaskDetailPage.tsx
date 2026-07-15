import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, useMotionValue, animate, useDragControls, type PanInfo } from 'motion/react'
import { ArrowLeft, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { db } from '@/lib/db'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusPicker } from '@/features/properties/status/StatusPicker'
import { SprintPicker } from '@/features/properties/sprint/SprintPicker'
import { Snooze } from '@/features/properties/snooze/Snooze'
import { RescheduleSheet } from '@/features/properties/snooze/RescheduleSheet'
import { formatDuration } from '@/features/properties/duration/durationDef'
import { updateTask } from './taskActions'
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function TaskDetailForm({ task, now }: { task: Task; now: Date }) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [name, setName] = useState(task.name)
  const [emoji, setEmoji] = useState(task.emoji ?? '')
  const [description, setDescription] = useState(task.description ?? '')
  const [sourceUrl, setSourceUrl] = useState(task.sourceUrl ?? '')
  const [durationMin, setDurationMin] = useState(task.duration ? String(Math.round(task.duration / 60)) : '')
  const [eventDateLocal, setEventDateLocal] = useState(task.eventDate ? toDatetimeLocal(task.eventDate) : '')

  const goal = useLiveQuery(() => task.goalId ? db.goals.get(task.goalId) : undefined, [task.goalId])
  const goalText = goal ? (goal.emoji ? `${goal.emoji} ${goal.name}` : goal.name) : null

  function saveName() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== task.name) void updateTask(task.id, { name: trimmed })
    else setName(task.name)
  }

  function saveEmoji() {
    const trimmed = emoji.trim()
    if (trimmed !== (task.emoji ?? '')) void updateTask(task.id, { emoji: trimmed || null })
  }

  function saveDescription() {
    if (description !== (task.description ?? '')) void updateTask(task.id, { description: description || null })
  }

  function saveSourceUrl() {
    const trimmed = sourceUrl.trim()
    if (trimmed !== (task.sourceUrl ?? '')) void updateTask(task.id, { sourceUrl: trimmed || null })
  }

  function saveDuration() {
    const minutes = parseFloat(durationMin)
    const seconds = minutes > 0 ? Math.round(minutes * 60) : null
    if (seconds !== task.duration) void updateTask(task.id, { duration: seconds })
  }

  function saveEventDate() {
    const iso = eventDateLocal ? new Date(eventDateLocal).toISOString() : null
    if (iso !== task.eventDate) void updateTask(task.id, { eventDate: iso })
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      <div className="flex items-start gap-2 px-4 pt-4 pb-3">
        <Input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          onBlur={saveEmoji}
          className="h-8 w-10 shrink-0 text-center text-lg px-0"
          placeholder="—"
        />
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={saveName}
          className="h-8 flex-1 text-base font-medium"
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
          <input
            type="datetime-local"
            value={eventDateLocal}
            onChange={e => setEventDateLocal(e.target.value)}
            onBlur={saveEventDate}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
          />
        </Field>

        <Field label="Snooze">
          <button
            onClick={() => setRescheduleOpen(true)}
            className="flex items-center gap-2 text-left text-sm hover:text-foreground"
          >
            {task.snooze ? <Snooze snooze={task.snooze} now={now} /> : <span className="text-muted-foreground/40">—</span>}
            <span className="text-xs text-muted-foreground">Snooze…</span>
          </button>
        </Field>

        <Field label="Duration">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={durationMin}
              onChange={e => setDurationMin(e.target.value)}
              onBlur={saveDuration}
              className="h-8 w-24"
              placeholder="Minutes"
            />
            {task.duration && (
              <span className="text-xs text-muted-foreground">{formatDuration(task.duration)}</span>
            )}
          </div>
        </Field>

        {goalText && (
          <Field label="Goal">
            <Badge variant="outline">{goalText}</Badge>
          </Field>
        )}

        <Field label="Link">
          <div className="flex items-center gap-2">
            <LinkIcon size={14} className="shrink-0 text-muted-foreground" />
            <Input
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              onBlur={saveSourceUrl}
              className="h-8 flex-1"
            />
            {task.sourceUrl && (
              <a href={task.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                <ExternalLink size={14} />
              </a>
            )}
          </div>
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

export function TaskDetailPage({ taskId, now, listPath }: TaskDetailPageProps) {
  const navigate = useNavigate()
  const task = useLiveQuery(() => db.tasks.get(taskId), [taskId])
  const x = useMotionValue(0)
  const dragControls = useDragControls()

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
      </div>

      {task && <TaskDetailForm task={task} now={now} />}
    </motion.div>
  )
}
