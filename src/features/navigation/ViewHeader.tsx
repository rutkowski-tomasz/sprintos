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

function SprintCurrentBadge() {
  return (
    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-purple-400 bg-purple-500/10 shrink-0">
      <span className="size-1 rounded-full bg-purple-300 shrink-0" />
      <span className="text-[9px] font-bold tracking-widest uppercase text-purple-300 leading-none">Current</span>
    </div>
  )
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
  const dayTrackHeight = useTransform(collapseT, [0, 0.45], [26, 0])
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
  const timingText = sprintTimingText(label, start, end, now)

  return (
    <div className="relative shrink-0" style={{ height: COLLAPSED_HEIGHT }}>
      <motion.div
        style={{ height }}
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
              {label === 'current' ? <SprintCurrentBadge /> : <SprintStatusText label={label} />}
              <div className="flex-1" />
              {syncIndicator}
              <motion.span style={{ opacity: daysLeftOpacity }} className="text-xs text-muted-foreground shrink-0">
                {timingText}
              </motion.span>
            </div>

            <motion.div style={{ opacity: dayTrackOpacity, height: dayTrackHeight, marginTop: trailingRowGap }} className="overflow-hidden">
              <DayTrack start={start} now={now} />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
