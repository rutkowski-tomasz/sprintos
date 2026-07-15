import { useMemo, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updateTask } from '@/features/tasks/taskActions'
import type { Task } from '@/types'
import { SNOOZE_OPTIONS, formatSnoozeOptionDate } from './snoozeDef'
import {
  classifySprintKey,
  formatSprintKey,
  sprintKey,
  SPRINT_LABEL_BADGE_CLASS,
} from '@/features/properties/sprint/sprintDef'

interface SnoozeSheetProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SprintMoveNote({ date, task, now }: { date: Date; task: Task; now: Date }) {
  const targetKey = sprintKey(date)
  if (!task.sprint || targetKey === task.sprint) return null
  const badge = classifySprintKey(targetKey, now)
  return (
    <Badge className={`${SPRINT_LABEL_BADGE_CLASS[badge]} text-[10px] shrink-0`}>
      Moves to Sprint {formatSprintKey(targetKey, now)}
    </Badge>
  )
}

export function SnoozeSheet({ task, open, onOpenChange }: SnoozeSheetProps) {
  const now = useMemo(() => new Date(), [open])
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('09:00')

  const customDateObj = useMemo(() => {
    if (!customDate) return null
    const [y, m, d] = customDate.split('-').map(Number)
    const [h, min] = customTime.split(':').map(Number)
    return new Date(y, m - 1, d, h, min)
  }, [customDate, customTime])

  function apply(date: Date) {
    const targetKey = sprintKey(date)
    const sprintPatch = task.sprint && targetKey !== task.sprint ? { sprint: targetKey } : {}
    void updateTask(task.id, { snooze: date.toISOString(), ...sprintPatch })
    onOpenChange(false)
  }

  function clear() {
    void updateTask(task.id, { snooze: null })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Snooze until</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4 pb-2">
          {SNOOZE_OPTIONS.map(option => {
            const date = option.getDate(now)
            return (
              <button
                key={option.key}
                onClick={() => apply(date)}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent"
              >
                <span className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{formatSnoozeOptionDate(date)}</span>
                </span>
                <SprintMoveNote date={date} task={task} now={now} />
              </button>
            )
          })}
          {task.snooze && (
            <button
              onClick={clear}
              className="rounded-lg px-3 py-2.5 text-left text-sm text-destructive hover:bg-accent"
            >
              Clear snooze
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 pt-3 pb-4">
          <span className="text-xs text-muted-foreground">Custom</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="flex-1 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
            />
            <input
              type="time"
              value={customTime}
              onChange={e => setCustomTime(e.target.value)}
              className="w-28 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
            />
          </div>
          {customDateObj && <SprintMoveNote date={customDateObj} task={task} now={now} />}
          <Button
            size="lg"
            className="w-full"
            disabled={!customDateObj}
            onClick={() => customDateObj && apply(customDateObj)}
          >
            Set snooze
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
