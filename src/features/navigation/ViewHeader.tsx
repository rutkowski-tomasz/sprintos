import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useSyncStatus } from '@/features/sync/useSyncStatus'
import { sprintDateRange } from '@/features/properties/sprints/sprintEngine'
import { TaskStatus, type Task } from '@/types'

interface Props {
  viewName: string
  sprintKey?: string
  tasks?: Task[]
}

function fmtRange(start: Date, end: Date): string {
  const startDay = start.toLocaleString('en', { weekday: 'short' })
  const endDay = end.toLocaleString('en', { weekday: 'short' })
  const startMonth = start.toLocaleString('en', { month: 'short' })
  const endMonth = end.toLocaleString('en', { month: 'short' })
  const startDate = start.getDate()
  const endDate = end.getDate()

  if (startMonth === endMonth) {
    return `${startDay} ${startDate} – ${endDay} ${endDate} ${endMonth}`
  }
  return `${startDay} ${startDate} ${startMonth} – ${endDay} ${endDate} ${endMonth}`
}

const SYNC_LABELS = { synced: 'Synced', sending: 'Sending', queued: 'In Queue' } as const
const SYNC_COLOR = { synced: 'text-green-400', sending: 'text-amber-400', queued: 'text-amber-400' } as const
const SYNC_DOT = { synced: 'bg-green-400', sending: 'bg-amber-400', queued: 'bg-amber-400' } as const

export function ViewHeader({ viewName, sprintKey, tasks }: Props) {
  const syncStatus = useSyncStatus()
  const sprintNum = sprintKey?.match(/(\d+)$/)?.[1]

  const dateRange = useMemo(() => {
    if (!sprintKey) return undefined
    const { start, end } = sprintDateRange(sprintKey)
    return fmtRange(start, end)
  }, [sprintKey])

  const inProgress = tasks?.filter(t => t.status === TaskStatus.IN_PROGRESS).length ?? 0

  const syncIndicator = syncStatus !== 'synced' && (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={cn('size-1.5 rounded-full', SYNC_DOT[syncStatus])} />
      <span className={cn('text-xs font-medium', SYNC_COLOR[syncStatus])}>
        {SYNC_LABELS[syncStatus]}
      </span>
    </div>
  )

  if (sprintKey) {
    return (
      <div className="px-4 pt-4 pb-3 flex items-stretch gap-3 border-b border-border">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-purple-500">
            {viewName}
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[8px] font-bold tracking-widest uppercase text-muted-foreground [writing-mode:vertical-rl] rotate-180 leading-none">
              SPRINT
            </span>
            <span className="text-5xl font-black leading-none tabular-nums">{sprintNum}</span>
          </div>
          <div className="h-0.75 bg-purple-500 mt-2" />
        </div>
        <div className="flex-1 flex flex-col items-end justify-end gap-1">
          {syncIndicator}
          {dateRange && <span className="text-sm font-medium">{dateRange}</span>}
          {tasks && (
            <span className="text-xs text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              {inProgress > 0 ? ` · ${inProgress} in progress` : ''}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border">
      <h2 className="text-xl font-semibold">{viewName}</h2>
      {syncIndicator}
    </div>
  )
}
