import { useMemo, useState } from 'react'
import { Moon, ArrowRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updateTask } from '@/features/tasks/taskActions'
import type { Task } from '@/types'
import { defaultCustomDateTime, isWithinCurrentSprint, SNOOZE_OPTIONS, formatSnoozeOptionDate } from './snoozeDef'
import {
  classifySprintKey,
  formatSprintKey,
  sprintKey,
  SPRINT_LABEL_BADGE_CLASS,
} from '@/features/properties/sprint/sprintDef'

interface RescheduleSheetProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  snoozeOnly?: boolean
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

export function RescheduleSheet({ task, open, onOpenChange, snoozeOnly = false }: RescheduleSheetProps) {
  const now = useMemo(() => new Date(), [open])
  const [customDateTime, setCustomDateTime] = useState(() => defaultCustomDateTime(new Date()))

  const customDateObj = useMemo(() => {
    if (!customDateTime) return null
    const [datePart, timePart] = customDateTime.split('T')
    const [y, m, d] = datePart.split('-').map(Number)
    const [h, min] = timePart.split(':').map(Number)
    return new Date(y, m - 1, d, h, min)
  }, [customDateTime])

  function apply(date: Date) {
    const targetKey = sprintKey(date)
    const sprintPatch = !snoozeOnly && task.sprint && targetKey !== task.sprint ? { sprint: targetKey } : {}
    void updateTask(task.id, { snooze: date.toISOString(), ...sprintPatch })
    onOpenChange(false)
  }

  function applyCustom(date: Date) {
    const targetKey = sprintKey(date)
    if (snoozeOnly || targetKey === sprintKey(now)) {
      void updateTask(task.id, { snooze: date.toISOString() })
    } else {
      void updateTask(task.id, { sprint: targetKey, snooze: null })
    }
    onOpenChange(false)
  }

  function moveToBacklog() {
    void updateTask(task.id, { snooze: null, sprint: null })
    onOpenChange(false)
  }

  function clear() {
    void updateTask(task.id, { snooze: null })
    onOpenChange(false)
  }

  const snoozeOptions = SNOOZE_OPTIONS.filter(
    option => !option.sameSprintOnly || isWithinCurrentSprint(option.getDate(now), now),
  )
  const moveOptions = snoozeOptions.filter(option => option.movesSprint)
  const pureSnoozeOptions = snoozeOptions.filter(option => !option.movesSprint)

  const customLabel = snoozeOnly
    ? 'Snooze'
    : customDateObj
      ? isWithinCurrentSprint(customDateObj, now)
        ? 'Snooze'
        : `Move to Sprint ${formatSprintKey(sprintKey(customDateObj), now)}`
      : 'Set snooze'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{snoozeOnly ? 'Snooze' : 'Reschedule'}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4 pb-2">
          {!snoozeOnly && <span className="px-3 pt-1 text-xs font-medium text-muted-foreground">Snooze</span>}
          {pureSnoozeOptions.map(option => {
            const date = option.getDate(now)
            return (
              <button
                key={option.key}
                onClick={() => apply(date)}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent"
              >
                <span className="flex items-center gap-2.5">
                  <Moon size={16} className="shrink-0 text-muted-foreground" />
                  <span className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{formatSnoozeOptionDate(date)}</span>
                  </span>
                </span>
                {!snoozeOnly && <SprintMoveNote date={date} task={task} now={now} />}
              </button>
            )
          })}

          {!snoozeOnly && (
            <>
              <span className="px-3 pt-3 text-xs font-medium text-muted-foreground">Move to sprint</span>
              {moveOptions.map(option => {
                const date = option.getDate(now)
                return (
                  <button
                    key={option.key}
                    onClick={() => apply(date)}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent"
                  >
                    <span className="flex items-center gap-2.5">
                      <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
                      <span className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          Sprint {formatSprintKey(sprintKey(date), now)}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
              <button
                onClick={moveToBacklog}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent"
              >
                <span className="flex items-center gap-2.5">
                  <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
                  <span className="flex flex-col">
                    <span>Backlog</span>
                    <span className="text-xs text-muted-foreground">Unassigned, no snooze</span>
                  </span>
                </span>
              </button>
            </>
          )}

          {task.snooze && (
            <button
              onClick={clear}
              className="mt-2 rounded-lg px-3 py-2.5 text-left text-sm text-destructive hover:bg-accent"
            >
              Clear snooze
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 pt-3 pb-4">
          <span className="text-xs text-muted-foreground">Custom</span>
          <input
            type="datetime-local"
            value={customDateTime}
            onChange={e => setCustomDateTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
          />
          <Button
            size="lg"
            className="w-full"
            disabled={!customDateObj}
            onClick={() => customDateObj && applyCustom(customDateObj)}
          >
            {customLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
