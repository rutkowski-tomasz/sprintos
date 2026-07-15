import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { updateTasks } from './taskActions'
import {
  classifySprintKey,
  formatSprintKey,
  sprintKeyOffset,
  SPRINT_LABEL_BADGE_CLASS,
  SPRINT_LABEL_TEXT,
} from '@/features/properties/sprint/sprintDef'

interface MassMoveSheetProps {
  taskIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}

export function MassMoveSheet({ taskIds, open, onOpenChange, onDone }: MassMoveSheetProps) {
  const now = useMemo(() => new Date(), [open])
  const sprintOptions = useMemo(() => [0, 1, 2].map(i => sprintKeyOffset(now, i)), [now])

  function moveTo(sprint: string | null) {
    void updateTasks(taskIds, sprint ? { sprint } : { sprint: null, snooze: null })
    onOpenChange(false)
    onDone()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Move {taskIds.length} task{taskIds.length === 1 ? '' : 's'}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4 pb-4">
          {sprintOptions.map(key => {
            const badge = classifySprintKey(key, now)
            return (
              <button
                key={key}
                onClick={() => moveTo(key)}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent"
              >
                <span className="flex items-center gap-2.5">
                  <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
                  Sprint {formatSprintKey(key, now)}
                </span>
                <Badge className={`${SPRINT_LABEL_BADGE_CLASS[badge]} text-[10px] shrink-0`}>
                  {SPRINT_LABEL_TEXT[badge]}
                </Badge>
              </button>
            )
          })}
          <button
            onClick={() => moveTo(null)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent"
          >
            <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
            Backlog
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
