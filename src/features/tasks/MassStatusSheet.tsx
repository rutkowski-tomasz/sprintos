import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { updateTasks } from './taskActions'
import type { TaskStatus } from '@/types'
import { ALL_STATUSES } from '@/features/properties/status/statusDef'
import { StatusChip } from '@/features/properties/status/StatusChip'

interface MassStatusSheetProps {
  taskIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}

export function MassStatusSheet({ taskIds, open, onOpenChange, onDone }: MassStatusSheetProps) {
  function pick(status: TaskStatus) {
    void updateTasks(taskIds, { status })
    onOpenChange(false)
    onDone()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Change status for {taskIds.length} task{taskIds.length === 1 ? '' : 's'}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4 pb-4">
          {ALL_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => pick(status)}
              className="flex items-center rounded-lg px-3 py-2.5 text-sm hover:bg-accent"
            >
              <StatusChip status={status} />
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
