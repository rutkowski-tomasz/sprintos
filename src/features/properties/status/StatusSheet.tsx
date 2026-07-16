import { Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { updateTask } from '@/features/tasks/taskActions'
import type { Task, TaskStatus } from '@/types'
import { ALL_STATUSES } from './statusDef'
import { StatusChip } from './StatusChip'

interface StatusSheetProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StatusSheet({ task, open, onOpenChange }: StatusSheetProps) {
  function pick(status: TaskStatus) {
    void updateTask(task.id, { status })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Change status</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4 pb-4">
          {ALL_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => pick(status)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-accent"
            >
              <StatusChip status={status} />
              {task.status === status && <Check size={16} className="text-muted-foreground" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
