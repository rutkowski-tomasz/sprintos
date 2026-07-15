import { useState } from 'react'
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'motion/react'
import { ListChecks, Clock } from 'lucide-react'
import { Duration } from '@/features/properties/duration/Duration'
import { EventDate } from '@/features/properties/event-date/EventDate'
import { Snooze } from '@/features/properties/snooze/Snooze'
import { SnoozeSheet } from '@/features/properties/snooze/SnoozeSheet'
import type { Goal, Task } from '@/types'
import { SprintPicker } from '@/features/properties/sprint/SprintPicker'
import { StatusPicker } from '@/features/properties/status/StatusPicker'
import { StatusSheet } from '@/features/properties/status/StatusSheet'

const SWIPE_THRESHOLD = 80

interface TaskRowProps {
  task: Task
  goalMap: Map<string, Goal>
  now: Date
}

export function TaskRow({ task, goalMap, now }: TaskRowProps) {
  const x = useMotionValue(0)
  const rightBgOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const leftBgOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  const [statusSheetOpen, setStatusSheetOpen] = useState(false)
  const [snoozeSheetOpen, setSnoozeSheetOpen] = useState(false)

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) setStatusSheetOpen(true)
    else if (info.offset.x < -SWIPE_THRESHOLD) setSnoozeSheetOpen(true)
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
        <ListChecks className="text-white" size={22} strokeWidth={2.5} />
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-end px-5 bg-indigo-500"
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
            {task.eventDate && <EventDate date={task.eventDate} now={now} />}
            {task.snooze && <Snooze snooze={task.snooze} now={now} />}
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

      <StatusSheet task={task} open={statusSheetOpen} onOpenChange={setStatusSheetOpen} />
      <SnoozeSheet task={task} open={snoozeSheetOpen} onOpenChange={setSnoozeSheetOpen} />
    </div>
  )
}
