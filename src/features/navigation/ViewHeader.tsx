import { useMemo, useRef, type RefObject } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'
import { useSyncStatus } from '@/features/sync/useSyncStatus'
import {
  classifySprintKey,
  sprintDateRange,
  type SprintLabel,
} from '@/features/properties/sprint/sprintDef'

interface ViewHeaderProps {
  viewName: string
  sprintKey?: string
  scrollContainerRef?: RefObject<HTMLDivElement | null>
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const EXPANDED_HEIGHT = 112
const COLLAPSED_HEIGHT = 56
const COLLAPSE_RANGE = EXPANDED_HEIGHT - COLLAPSED_HEIGHT

export const SPRINT_HEADER_INSET = EXPANDED_HEIGHT - COLLAPSED_HEIGHT

const STATUS_LABEL: Record<SprintLabel, string> = {
  current: 'Current',
  next: 'Next',
  previous: 'Previous',
  past: 'Past',
  future: 'Future',
}

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

function sprintDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

function SprintStatusBadge({ label }: { label: SprintLabel }) {
  if (label === 'current') {
    return (
      <div className="flex items-center gap-1 self-start rounded-full border border-purple-400 bg-purple-500/10 px-2.5 py-0.5 shrink-0">
        <span className="size-1 rounded-full bg-purple-300" />
        <span className="text-[8px] font-bold tracking-widest uppercase text-purple-300">Current</span>
      </div>
    )
  }
  return <SprintStatusText label={label} />
}

function SprintStatusText({ label }: { label: SprintLabel }) {
  return (
    <span
      className={cn(
        'text-xs font-bold tracking-widest uppercase shrink-0',
        label === 'current' ? 'text-purple-400' : 'text-muted-foreground',
      )}
    >
      {STATUS_LABEL[label]}
    </span>
  )
}

function DayTrack({ start, now }: { start: Date; now: Date }) {
  const today = startOfDay(now)
  return (
    <div className="flex w-full justify-between">
      {sprintDays(start).map((day, i) => {
        const isToday = isSameDay(day, now)
        const isPast = day.getTime() < today.getTime()
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
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
          </div>
        )
      })}
    </div>
  )
}

export function ViewHeader({ viewName, sprintKey, scrollContainerRef }: ViewHeaderProps) {
  const syncStatus = useSyncStatus()
  const now = useMemo(() => new Date(), [])
  const fallbackRef = useRef<HTMLDivElement>(null)
  const { scrollY, scrollYProgress } = useScroll({ container: scrollContainerRef ?? fallbackRef })
  const collapseT = useTransform([scrollY, scrollYProgress], (latest) => {
    const [sy, progress] = latest as [number, number]
    if (sy > 0 && progress >= 0.999) return 1
    return Math.min(1, Math.max(0, sy / COLLAPSE_RANGE))
  })
  const height = useTransform(collapseT, t => EXPANDED_HEIGHT - t * COLLAPSE_RANGE)
  const expandedOpacity = useTransform(collapseT, [0, 0.6], [1, 0])
  const collapsedOpacity = useTransform(collapseT, [0.5, 1], [0, 1])

  const syncIndicator = syncStatus !== 'synced' && (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={cn('size-1.5 rounded-full', SYNC_DOT[syncStatus])} />
      <span className={cn('text-xs font-medium', SYNC_COLOR[syncStatus])}>
        {SYNC_LABELS[syncStatus]}
      </span>
    </div>
  )

  if (!sprintKey) {
    return (
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border">
        <h2 className="text-xl font-semibold">{viewName}</h2>
        {syncIndicator}
      </div>
    )
  }

  const sprintNum = sprintKey.match(/(\d+)$/)?.[1]?.padStart(2, '0')
  const label = classifySprintKey(sprintKey, now)
  const { start, end } = sprintDateRange(sprintKey)
  const daysLeft = daysLeftInSprint(end, now)

  return (
    <div className="relative shrink-0" style={{ height: COLLAPSED_HEIGHT }}>
      <motion.div
        style={{ height }}
        className="absolute top-0 left-0 right-0 z-10 overflow-hidden border-b border-border bg-background"
      >
        <motion.div style={{ opacity: expandedOpacity }} className="absolute inset-0 flex items-center gap-3 px-4">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground [writing-mode:vertical-rl] rotate-180 leading-none">
              SPRINT
            </span>
            <span className="text-7xl font-black leading-none tabular-nums">{sprintNum}</span>
          </div>
          <div className="w-px self-stretch bg-border shrink-0" />
          <div className="flex flex-1 flex-col gap-5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <SprintStatusBadge label={label} />
              {syncIndicator}
            </div>
            <DayTrack start={start} now={now} />
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: collapsedOpacity, height: COLLAPSED_HEIGHT }}
          className="absolute bottom-0 left-0 right-0 flex items-center gap-2.5 px-4"
        >
          <div className="flex items-center gap-1.5 rounded-full border-2 border-purple-500/70 px-2.5 py-1 shrink-0">
            <span className="size-1.5 rounded-full bg-purple-400" />
            <span className="text-xs font-bold tracking-wide">SPRINT {sprintNum}</span>
          </div>
          <SprintStatusText label={label} />
          <div className="flex-1" />
          {syncIndicator}
          <span className="text-xs text-muted-foreground shrink-0">{daysLeft}d left</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
