import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'motion/react'
import { ListChecks, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DurationChip } from '@/features/properties/duration/DurationChip'
import { EventDateChip } from '@/features/properties/event-date/EventDateChip'
import { SnoozeChip } from '@/features/properties/snooze/SnoozeChip'
import { RescheduleSheet } from '@/features/properties/snooze/RescheduleSheet'
import { GoalChip } from '@/features/properties/goal/GoalChip'
import { SourceUrlChip } from '@/features/properties/url/SourceUrlChip'
import { DescriptionChip } from '@/features/properties/description/DescriptionChip'
import type { Goal, Task } from '@/types'
import { SprintPicker } from '@/features/properties/sprint/SprintPicker'
import { StatusPicker } from '@/features/properties/status/StatusPicker'
import { StatusSheet } from '@/features/properties/status/StatusSheet'

const SWIPE_THRESHOLD = 80
const LONG_PRESS_MS = 500
const LONG_PRESS_MOVE_TOLERANCE = 10

interface TaskRowProps {
  task: Task
  goalMap: Map<string, Goal>
  now: Date
  selectMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
  onLongPress: (id: string) => void
  onOpenDetail: (task: Task) => void
}

export function TaskRow({ task, goalMap, now, selectMode, selected, onToggleSelect, onLongPress, onOpenDetail }: TaskRowProps) {
  const x = useMotionValue(0)
  const rightBgOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const leftBgOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  const [statusSheetOpen, setStatusSheetOpen] = useState(false)
  const [rescheduleSheetOpen, setRescheduleSheetOpen] = useState(false)
  const [isPressing, setIsPressing] = useState(false)
  const longPressTimer = useRef<number | null>(null)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  const longPressFired = useRef(false)

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) setStatusSheetOpen(true)
    else if (info.offset.x < -SWIPE_THRESHOLD) setRescheduleSheetOpen(true)
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 })
  }

  function clearLongPress() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    pressStart.current = null
    setIsPressing(false)
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (selectMode) return
    longPressFired.current = false
    pressStart.current = { x: e.clientX, y: e.clientY }
    setIsPressing(true)
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true
      longPressTimer.current = null
      setIsPressing(false)
      onLongPress(task.id)
    }, LONG_PRESS_MS)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pressStart.current) return
    const dx = Math.abs(e.clientX - pressStart.current.x)
    const dy = Math.abs(e.clientY - pressStart.current.y)
    if (dx > LONG_PRESS_MOVE_TOLERANCE || dy > LONG_PRESS_MOVE_TOLERANCE) clearLongPress()
  }

  function handleClick() {
    if (longPressFired.current) {
      longPressFired.current = false
      return
    }
    if (selectMode) onToggleSelect(task.id)
    else onOpenDetail(task)
  }

  const goal = task.goalId ? goalMap.get(task.goalId) : null

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
        drag={selectMode ? false : 'x'}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
        onClick={handleClick}
        className={cn(
          'relative bg-background flex items-start gap-3 px-4 py-3',
          selected ? 'bg-accent' : isPressing && 'bg-accent/40',
        )}
      >
        {selectMode ? (
          <div
            className={cn(
              'size-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center',
              selected ? 'bg-primary border-primary' : 'border-muted-foreground/40',
            )}
          >
            {selected && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
          </div>
        ) : (
          <span className="text-lg w-6 text-center leading-none shrink-0 mt-0.5">{task.emoji ?? ''}</span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm truncate flex-1 min-w-0">{task.name}</p>
            {task.eventDate && <EventDateChip date={task.eventDate} now={now} />}
            <SnoozeChip task={task} now={now} />
          </div>

          {(task.duration || goal || task.sourceUrl || task.description) && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {task.duration && <DurationChip seconds={task.duration} />}
              {goal && <GoalChip goal={goal} />}
              <SourceUrlChip url={task.sourceUrl} />
              <DescriptionChip description={task.description} />
            </div>
          )}
        </div>

        <div
          className="shrink-0 flex flex-col items-end gap-1"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <StatusPicker task={task} />
          <SprintPicker task={task} />
        </div>
      </motion.div>

      <StatusSheet task={task} open={statusSheetOpen} onOpenChange={setStatusSheetOpen} />
      <RescheduleSheet task={task} open={rescheduleSheetOpen} onOpenChange={setRescheduleSheetOpen} />
    </div>
  )
}
