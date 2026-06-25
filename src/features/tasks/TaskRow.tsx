import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'motion/react'
import { Check } from 'lucide-react'
import { updateTask } from './taskActions'
import { Duration } from '@/features/properties/duration/Duration'
import { EventDate } from '@/features/properties/event-date/EventDate'
import { Snooze } from '@/features/properties/snooze/Snooze'
import { TaskStatus, type Goal, type Task } from '@/types'
import { SprintPicker } from '@/features/properties/sprints/SprintPicker'
import { StatusPicker } from '@/features/properties/status/StatusPicker'

const DONE_THRESHOLD = 80

interface TaskRowProps {
  task: Task
  goalMap: Map<string, Goal>
}

export function TaskRow({ task, goalMap }: TaskRowProps) {
  const x = useMotionValue(0)
  const rightBgOpacity = useTransform(x, [0, DONE_THRESHOLD], [0, 1])

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > DONE_THRESHOLD) void updateTask(task.id, { status: TaskStatus.DONE })
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 })
  }

  const goal = task.goalId ? goalMap.get(task.goalId) : null
  const goalText = goal ? (goal.emoji ? `${goal.emoji} ${goal.name}` : goal.name) : null

  return (
    <div className="relative overflow-hidden border-b border-border">
      <motion.div
        className="absolute inset-0 flex items-center px-5 bg-emerald-500"
        style={{ opacity: rightBgOpacity }}
      >
        <Check className="text-white" size={22} strokeWidth={2.5} />
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
            {task.eventDate && <EventDate date={task.eventDate} />}
            {task.snooze && <Snooze snooze={task.snooze} />}
          </div>

          {(task.duration || goalText) && (
            <p className="text-[11px] text-muted-foreground/50 mt-1 truncate">
              {task.duration && <Duration seconds={task.duration} />}
              {task.duration && goalText && ' · '}
              {goalText}
            </p>
          )}
        </div>

        <div
          className="shrink-0 flex flex-col items-end gap-1"
          onPointerDown={e => e.stopPropagation()}
        >
          <StatusPicker task={task} />
          <div className="text-[11px] text-muted-foreground/50">
            <SprintPicker task={task} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
