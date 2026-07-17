import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'motion/react'
import { QueueListIcon, ClockIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
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
import { isEventDateMisaligned } from '@/features/properties/sprint/sprintDef'
import { StatusPicker } from '@/features/properties/status/StatusPicker'
import { StatusSheet } from '@/features/properties/status/StatusSheet'

const SWIPE_THRESHOLD = 80
const SWIPE_VELOCITY_THRESHOLD = 500
const SWIPE_RESIST_FACTOR = 0.3
const SWIPE_UNCROSS_MARGIN = 12
const LONG_PRESS_MS = 500
const LONG_PRESS_MOVE_TOLERANCE = 10

function resistDrag(offset: number, threshold: number): number {
  const abs = Math.abs(offset)
  if (abs <= threshold) return offset
  const damped = threshold + (abs - threshold) * SWIPE_RESIST_FACTOR
  return offset < 0 ? -damped : damped
}

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
  const rightBgOpacity = useTransform(x, [0, 16], [0, 1])
  const leftBgOpacity = useTransform(x, [-16, 0], [1, 0])
  const rightBgColor = useTransform(x, [0, SWIPE_THRESHOLD], ['rgba(16,185,129,0.35)', 'rgba(16,185,129,1)'])
  const leftBgColor = useTransform(x, [-SWIPE_THRESHOLD, 0], ['rgba(99,102,241,1)', 'rgba(99,102,241,0.35)'])
  const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1])
  const leftIconScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.8])
  const rightLabelOpacity = useTransform(x, [16, 44], [0, 1])
  const leftLabelOpacity = useTransform(x, [-44, -16], [1, 0])
  const bumpScaleRight = useMotionValue(1)
  const bumpScaleLeft = useMotionValue(1)
  const [statusSheetOpen, setStatusSheetOpen] = useState(false)
  const [rescheduleSheetOpen, setRescheduleSheetOpen] = useState(false)
  const [isPressing, setIsPressing] = useState(false)
  const longPressTimer = useRef<number | null>(null)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  const longPressFired = useRef(false)
  const crossedRight = useRef(false)
  const crossedLeft = useRef(false)

  function handleDrag(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const resisted = resistDrag(info.offset.x, SWIPE_THRESHOLD)
    x.set(resisted)

    if (resisted > SWIPE_THRESHOLD && !crossedRight.current) {
      crossedRight.current = true
      navigator.vibrate?.(8)
      animate(bumpScaleRight, [1, 1.3, 1], { duration: 0.26, ease: 'easeOut' })
    } else if (resisted <= SWIPE_THRESHOLD - SWIPE_UNCROSS_MARGIN) {
      crossedRight.current = false
    }

    if (resisted < -SWIPE_THRESHOLD && !crossedLeft.current) {
      crossedLeft.current = true
      navigator.vibrate?.(8)
      animate(bumpScaleLeft, [1, 1.3, 1], { duration: 0.26, ease: 'easeOut' })
    } else if (resisted >= -SWIPE_THRESHOLD + SWIPE_UNCROSS_MARGIN) {
      crossedLeft.current = false
    }
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const passedRight = crossedRight.current || info.velocity.x > SWIPE_VELOCITY_THRESHOLD
    const passedLeft = crossedLeft.current || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD
    if (passedRight) setStatusSheetOpen(true)
    else if (passedLeft) setRescheduleSheetOpen(true)
    crossedRight.current = false
    crossedLeft.current = false
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 32 })
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
  const misaligned = !!(task.eventDate && task.sprint && isEventDateMisaligned(task.eventDate, task.sprint))

  return (
    <div className="relative overflow-hidden border-b border-border">
      <motion.div
        className="absolute inset-0 flex items-center justify-start px-5"
        style={{ opacity: rightBgOpacity, backgroundColor: rightBgColor }}
      >
        <div className="flex flex-col items-center gap-1">
          <motion.div style={{ scale: rightIconScale }}>
            <motion.div style={{ scale: bumpScaleRight }}>
              <QueueListIcon className="text-white size-[22px]" strokeWidth={2.5} />
            </motion.div>
          </motion.div>
          <motion.span style={{ opacity: rightLabelOpacity }} className="text-white/85 text-[10px] font-medium">
            Status
          </motion.span>
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-end px-5"
        style={{ opacity: leftBgOpacity, backgroundColor: leftBgColor }}
      >
        <div className="flex flex-col items-center gap-1">
          <motion.div style={{ scale: leftIconScale }}>
            <motion.div style={{ scale: bumpScaleLeft }}>
              <ClockIcon className="text-white size-[22px]" strokeWidth={2.5} />
            </motion.div>
          </motion.div>
          <motion.span style={{ opacity: leftLabelOpacity }} className="text-white/85 text-[10px] font-medium">
            Reschedule
          </motion.span>
        </div>
      </motion.div>

      <motion.div
        drag={selectMode ? false : 'x'}
        dragMomentum={false}
        dragElastic={1}
        style={{ x }}
        onDrag={handleDrag}
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
            {selected && <CheckIcon className="size-3 text-primary-foreground" strokeWidth={3} />}
          </div>
        ) : (
          <span className="text-lg w-6 text-center leading-none shrink-0 mt-0.5">{task.emoji ?? ''}</span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm truncate flex-1 min-w-0">{task.name}</p>
            <SnoozeChip task={task} now={now} />
          </div>

          {(task.eventDate || task.duration || goal || task.sourceUrl || task.description) && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {task.eventDate && (
                <span className="inline-flex items-center gap-1">
                  <EventDateChip date={task.eventDate} now={now} />
                  {misaligned && (
                    <span title="Event date is outside the assigned sprint" className="shrink-0 flex">
                      <ExclamationTriangleIcon className="size-3 text-muted-foreground/50" />
                    </span>
                  )}
                </span>
              )}
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
