import { useMemo, type RefObject } from 'react'
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useSyncStatus } from '@/features/sync/useSyncStatus'
import {
  classifySprintKey,
  sprintDateRange,
  sprintKeyAdjacent,
  sprintWeekNumber,
  type SprintLabel,
} from '@/features/properties/sprint/sprintDef'
import { SprintBadge } from '@/features/properties/sprint/SprintBadge'
import { useSprintCollapseT, EXPANDED_HEIGHT, COLLAPSED_HEIGHT, COLLAPSE_RANGE } from './sprintHeaderCollapse'
import { SiteHeader } from './SiteHeader'
import { EVENT_DATE_COLOR } from '@/features/properties/event-date/eventDateDef'
import { SNOOZE_COLOR } from '@/features/properties/snooze/SnoozeChip'
import { resolveSnoozeDate } from '@/features/properties/snooze/snoozeDef'
import type { Task } from '@/types'

interface ViewHeaderProps {
  viewName: string
  sprintKey?: string
  scrollContainerRef?: RefObject<HTMLDivElement | null>
  tasks?: Task[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const SPRINT_HEADER_INSET = EXPANDED_HEIGHT - COLLAPSED_HEIGHT

const SYNC_LABELS = { synced: 'Synced', sending: 'Sending', queued: 'In Queue' } as const
const SYNC_COLOR = { synced: 'text-green-400', sending: 'text-amber-400', queued: 'text-amber-400' } as const
const SYNC_DOT = { synced: 'bg-green-400', sending: 'bg-amber-400', queued: 'bg-amber-400' } as const

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysLeftInSprint(end: Date, now: Date): number {
  const endOfDay = new Date(end)
  endOfDay.setHours(23, 59, 59, 999)
  return Math.max(0, Math.ceil((endOfDay.getTime() - now.getTime()) / MS_PER_DAY))
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY)
}

function formatRelativeDays(days: number): string {
  if (days < 14) {
    return days === 1 ? '1 day' : `${days} days`
  }
  const weeks = Math.round(days / 7)
  return weeks === 1 ? '1 week' : `${weeks} weeks`
}

function sprintTimingText(label: SprintLabel, start: Date, end: Date, now: Date): string {
  if (label === 'current') {
    return `${daysLeftInSprint(end, now)}d left`
  }
  if (label === 'next' || label === 'future') {
    return `in ${formatRelativeDays(daysBetween(now, start))}`
  }
  return `${formatRelativeDays(daysBetween(end, now))} ago`
}

function sprintDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

interface DayMarks {
  hasEvent: boolean
  hasSnooze: boolean
}

function dayMarksByDate(tasks: Task[], now: Date): Map<number, DayMarks> {
  const marks = new Map<number, DayMarks>()
  const mark = (d: Date, field: 'hasEvent' | 'hasSnooze') => {
    const k = startOfDay(d).getTime()
    const existing = marks.get(k) ?? { hasEvent: false, hasSnooze: false }
    existing[field] = true
    marks.set(k, existing)
  }
  for (const task of tasks) {
    if (task.eventDate) mark(new Date(task.eventDate), 'hasEvent')
    const snoozeDate = resolveSnoozeDate(task)
    if (snoozeDate && snoozeDate > now) mark(snoozeDate, 'hasSnooze')
  }
  return marks
}

function DayTrack({ start, now, tasks }: { start: Date; now: Date; tasks: Task[] }) {
  const today = startOfDay(now)
  const marks = useMemo(() => dayMarksByDate(tasks, now), [tasks, now])
  return (
    <div className="flex w-full justify-end gap-2">
      {sprintDays(start).map((day, i) => {
        const isToday = isSameDay(day, now)
        const isPast = day.getTime() < today.getTime()
        const showMonth = i === 0 || day.getDate() === 1
        const dayMarks = marks.get(startOfDay(day).getTime())
        return (
          <div key={i} className="flex w-8 shrink-0 flex-col items-center gap-0.5">
            <span
              className={cn(
                'text-[8px] font-medium uppercase tracking-wide leading-none',
                isPast ? 'text-muted-foreground/20' : 'text-muted-foreground/50',
              )}
            >
              {showMonth ? day.toLocaleString('en', { month: 'short' }) : ' '}
            </span>
            <span
              className={cn(
                'text-[8px] font-medium uppercase tracking-wide',
                isToday ? 'text-foreground' : isPast ? 'text-muted-foreground/30' : 'text-muted-foreground/70',
              )}
            >
              {day.toLocaleString('en', { weekday: 'short' })}
            </span>
            <span
              className={cn(
                'text-xs leading-none tabular-nums',
                isToday ? 'font-semibold text-foreground' : 'font-medium',
                !isToday && (isPast ? 'text-muted-foreground/30' : 'text-muted-foreground/70'),
              )}
            >
              {day.getDate()}
            </span>
            <span className="flex items-center gap-0.5 h-1">
              {dayMarks?.hasEvent && <span className="size-1 rounded-full" style={{ backgroundColor: EVENT_DATE_COLOR }} />}
              {dayMarks?.hasSnooze && <span className="size-1 rounded-full" style={{ backgroundColor: SNOOZE_COLOR }} />}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const SWIPE_OFFSET_THRESHOLD = 60
const SWIPE_VELOCITY_THRESHOLD = 500

export function ViewHeader({ viewName, sprintKey, scrollContainerRef, tasks = [] }: ViewHeaderProps) {
  const syncStatus = useSyncStatus()
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  const collapseT = useSprintCollapseT(scrollContainerRef)
  const dragX = useMotionValue(0)

  const handleDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const shouldNavigate = Math.abs(info.offset.x) > SWIPE_OFFSET_THRESHOLD || Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD
    if (shouldNavigate && sprintKey) {
      const weekOffset = info.offset.x > 0 ? -1 : 1
      const target = sprintKeyAdjacent(sprintKey, weekOffset)
      navigate(`/sprint/${target.replace(/ /g, '-')}`)
    }
    animate(dragX, 0, { type: 'spring', stiffness: 500, damping: 40 })
  }

  const prevIndicatorOpacity = useTransform(dragX, [0, SWIPE_OFFSET_THRESHOLD], [0, 1])
  const nextIndicatorOpacity = useTransform(dragX, [-SWIPE_OFFSET_THRESHOLD, 0], [1, 0])
  const prevIndicatorScale = useTransform(dragX, [0, SWIPE_OFFSET_THRESHOLD], [0.5, 1])
  const nextIndicatorScale = useTransform(dragX, [-SWIPE_OFFSET_THRESHOLD, 0], [1, 0.5])
  const prevIndicatorColor = useTransform(dragX, [0, SWIPE_OFFSET_THRESHOLD], ['rgba(255,255,255,0.25)', '#a855f7'])
  const nextIndicatorColor = useTransform(dragX, [-SWIPE_OFFSET_THRESHOLD, 0], ['#a855f7', 'rgba(255,255,255,0.25)'])

  const height = useTransform(collapseT, t => EXPANDED_HEIGHT - t * COLLAPSE_RANGE)
  const accentBarOpacity = useTransform(collapseT, [0, 0.4], [1, 0])
  const numberGroupGap = useTransform(collapseT, [0, 0.35], [8, 0])
  const verticalLabelOpacity = useTransform(collapseT, [0, 0.35], [1, 0])
  const verticalLabelWidth = useTransform(collapseT, [0, 0.35], [14, 0])
  const horizontalLabelOpacity = useTransform(collapseT, [0, 0.35], [0, 1])
  const horizontalLabelWidth = useTransform(collapseT, [0, 0.35], [0, 50])
  const numberFontSize = useTransform(collapseT, [0, 1], [72, 12])
  const numberFontWeight = useTransform(collapseT, [0, 1], [900, 700])
  const dividerHeight = useTransform(height, h => Math.max(h - 32, 0))
  const rowOuterGap = useTransform(collapseT, [0, 0.4], [12, 6])
  const dayTrackOpacity = useTransform(collapseT, [0, 0.3], [1, 0])
  const dayTrackHeight = useTransform(collapseT, [0, 0.45], [44, 0])
  const trailingRowGap = useTransform(collapseT, [0, 0.45], [20, 0])
  const daysLeftOpacity = useTransform(collapseT, [0.5, 0.85], [0, 1])

  const syncIndicator = syncStatus !== 'synced' && (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={cn('size-1.5 rounded-full', SYNC_DOT[syncStatus])} />
      <span className={cn('text-xs font-medium', SYNC_COLOR[syncStatus])}>
        {SYNC_LABELS[syncStatus]}
      </span>
    </div>
  )

  if (!sprintKey) {
    return <SiteHeader viewName={viewName}>{syncIndicator}</SiteHeader>
  }

  const sprintNum = sprintWeekNumber(sprintKey)
  const label = classifySprintKey(sprintKey, now)
  const { start, end } = sprintDateRange(sprintKey)
  const timingText = sprintTimingText(label, start, end, now)

  const prevTargetNum = sprintWeekNumber(sprintKeyAdjacent(sprintKey, -1))
  const nextTargetNum = sprintWeekNumber(sprintKeyAdjacent(sprintKey, 1))

  return (
    <div className="relative shrink-0" style={{ height: COLLAPSED_HEIGHT }}>
      <motion.div
        style={{ opacity: prevIndicatorOpacity, scale: prevIndicatorScale, color: prevIndicatorColor }}
        className="absolute inset-y-0 left-0 z-0 flex items-center gap-1.5 pl-5"
        aria-hidden="true"
      >
        <ChevronLeftIcon className="size-[18px]" strokeWidth={2.5} />
        <span className="text-[11px] font-medium whitespace-nowrap">Go to</span>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-current whitespace-nowrap">
          Sprint {prevTargetNum}
        </span>
      </motion.div>
      <motion.div
        style={{ opacity: nextIndicatorOpacity, scale: nextIndicatorScale, color: nextIndicatorColor }}
        className="absolute inset-y-0 right-0 z-0 flex items-center justify-end gap-1.5 pr-5"
        aria-hidden="true"
      >
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-current whitespace-nowrap">
          Sprint {nextTargetNum}
        </span>
        <span className="text-[11px] font-medium whitespace-nowrap">Go to</span>
        <ChevronRightIcon className="size-[18px]" strokeWidth={2.5} />
      </motion.div>
      <motion.div
        style={{ height, x: dragX }}
        drag="x"
        dragElastic={0.5}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="absolute top-0 left-0 right-0 z-10 overflow-hidden border-b border-border bg-background"
      >
        <motion.span style={{ opacity: accentBarOpacity }} className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
        <motion.div style={{ gap: rowOuterGap }} className="flex h-full items-center px-4">
          <div className="flex items-center shrink-0">
            <motion.span
              style={{ opacity: verticalLabelOpacity, width: verticalLabelWidth, marginRight: numberGroupGap }}
              className="overflow-hidden text-[10px] font-bold tracking-widest uppercase text-muted-foreground [writing-mode:vertical-rl] rotate-180 leading-none"
            >
              SPRINT
            </motion.span>
            <motion.span
              style={{ opacity: horizontalLabelOpacity, width: horizontalLabelWidth }}
              className="overflow-hidden whitespace-nowrap text-xs font-bold tracking-wide uppercase leading-none text-muted-foreground"
            >
              SPRINT
            </motion.span>
            <motion.span
              style={{ fontSize: numberFontSize, fontWeight: numberFontWeight }}
              className="leading-none tabular-nums"
            >
              {sprintNum}
            </motion.span>
          </div>

          <motion.div style={{ height: dividerHeight }} className="w-px self-center bg-border shrink-0" />

          <div className="relative flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <SprintBadge label={label} sprintKey={sprintKey} now={now} />
              <div className="flex-1" />
              {syncIndicator}
              <motion.span style={{ opacity: daysLeftOpacity }} className="text-xs text-muted-foreground shrink-0">
                {timingText}
              </motion.span>
            </div>

            <motion.div style={{ opacity: dayTrackOpacity, height: dayTrackHeight, marginTop: trailingRowGap }} className="overflow-hidden">
              <DayTrack start={start} now={now} tasks={tasks} />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
