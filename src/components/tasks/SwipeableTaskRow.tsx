import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'motion/react'
import { Check, Clock } from 'lucide-react'
import { updateTask } from '@/lib/taskActions'
import { formatDate, formatDuration } from '@/lib/formatters'
import { TaskStatus, type Goal, type Task } from '@/types'
import { Badge } from '@/components/ui/badge'
import { SprintPicker } from '@/components/tasks/SprintPicker'

const DONE_THRESHOLD = 80
const SNOOZE_THRESHOLD = 80

const STATUS_BADGE: Record<number, string> = {
  [TaskStatus.TODO]: 'bg-zinc-500/15 text-zinc-400 border-transparent',
  [TaskStatus.NEXT]: 'bg-purple-500/15 text-purple-400 border-transparent',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-500/15 text-blue-400 border-transparent',
  [TaskStatus.DONE]: 'bg-emerald-500/15 text-emerald-400 border-transparent',
  [TaskStatus.ARCHIVED]: 'bg-zinc-400/10 text-zinc-500 border-transparent',
}

const STATUS_LABELS: Record<number, string> = {
  [TaskStatus.TODO]: 'To-Do',
  [TaskStatus.NEXT]: 'Next',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.ARCHIVED]: 'Archived',
}

function snoozeShort(snooze: string): string {
  if (snooze.startsWith('-')) {
    const secs = Math.abs(parseInt(snooze.slice(1)))
    const d = Math.floor(secs / 86400)
    const h = Math.floor(secs / 3600)
    if (d && secs % 86400 === 0) return `−${d}d`
    if (h) return `−${h}h`
    return `−${secs}s`
  }
  return `@${formatDate(snooze)}`
}

interface SwipeableTaskRowProps {
  task: Task
  goalMap: Map<string, Goal>
  onSnoozeRequest: (task: Task) => void
}

export function SwipeableTaskRow({ task, goalMap, onSnoozeRequest }: SwipeableTaskRowProps) {
  const x = useMotionValue(0)

  const rightBgOpacity = useTransform(x, [0, DONE_THRESHOLD], [0, 1])
  const leftBgOpacity = useTransform(x, [-SNOOZE_THRESHOLD, 0], [1, 0])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offsetX = info.offset.x
    if (offsetX > DONE_THRESHOLD) void updateTask(task.id, { status: TaskStatus.DONE })
    else if (offsetX < -SNOOZE_THRESHOLD) onSnoozeRequest(task)
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 })
  }

  const goal = task.goalId ? goalMap.get(task.goalId) : null
  const leftMeta = [
    task.duration ? formatDuration(task.duration) : null,
    goal ? (goal.emoji ? `${goal.emoji} ${goal.name}` : goal.name) : null,
  ].filter(Boolean)

  return (
    <div className="relative overflow-hidden border-b border-border">
      <motion.div
        className="absolute inset-0 flex items-center px-5 bg-emerald-500"
        style={{ opacity: rightBgOpacity }}
      >
        <Check className="text-white" size={22} strokeWidth={2.5} />
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-end px-5 bg-amber-500"
        style={{ opacity: leftBgOpacity }}
      >
        <Clock className="text-white" size={22} strokeWidth={2.5} />
      </motion.div>

      <motion.div
        drag="x"
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative bg-background flex items-start gap-3 px-4 py-3"
      >
        <span className="text-lg w-6 text-center leading-none shrink-0 mt-0.5">{task.emoji ?? ''}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm truncate flex-1 min-w-0">{task.name}</p>
            {task.eventDate && (
              <span className="text-xs text-muted-foreground shrink-0">{formatDate(task.eventDate)}</span>
            )}
            {task.snooze && (
              <span className="text-xs text-indigo-400 shrink-0">{snoozeShort(task.snooze)}</span>
            )}
          </div>

          {leftMeta.length > 0 && (
            <p className="text-[11px] text-muted-foreground/50 mt-1 truncate">
              {leftMeta.join(' · ')}
            </p>
          )}
        </div>

        <div
          className="shrink-0 flex flex-col items-end gap-1"
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="relative inline-flex">
            <Badge className={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</Badge>
            <select
              value={task.status}
              onChange={e => void updateTask(task.id, { status: Number(e.target.value) as TaskStatus })}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Task status"
            >
              {Object.entries(STATUS_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
          <div className="text-[11px] text-muted-foreground/50">
            <SprintPicker task={task} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
