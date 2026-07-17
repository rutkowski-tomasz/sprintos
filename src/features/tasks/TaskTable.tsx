import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { classifySprintKey, formatSprintKey, formatSprintDateRange, SPRINT_LABEL_COLOR, SPRINT_LABEL_TEXT, sprintRelativeLabel } from '@/features/properties/sprint/sprintDef'
import { TaskTableRow } from './TaskTableRow'
import type { Goal, Task } from '@/types'

const COLUMN_COUNT = 8

interface TaskTableProps {
  tasks: Task[]
  goalMap: Map<string, Goal>
  now: Date
  groupBySprint?: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  allSelected: boolean
  onToggleSelectAll: () => void
  onOpenDetail: (task: Task) => void
}

function sprintLabelText(sprint: string, now: Date): string {
  const label = classifySprintKey(sprint, now)
  if (label === 'future' || label === 'past') return `${SPRINT_LABEL_TEXT[label]} · ${sprintRelativeLabel(sprint, now)}`
  return SPRINT_LABEL_TEXT[label]
}

function SprintGroupRow({ sprint, now }: { sprint: string | null; now: Date }) {
  if (!sprint) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={COLUMN_COUNT} className="pt-6 pb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase leading-none text-muted-foreground/35">
            Backlog
          </span>
        </TableCell>
      </TableRow>
    )
  }
  const label = classifySprintKey(sprint, now)
  const color = SPRINT_LABEL_COLOR[label]
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={COLUMN_COUNT} className="pt-6 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="size-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-bold tracking-widest uppercase leading-none" style={{ color }}>
            Sprint {formatSprintKey(sprint, now)} · {sprintLabelText(sprint, now)}
          </span>
          <span className="text-[10px] font-medium leading-none text-muted-foreground/50 ml-auto">
            {formatSprintDateRange(sprint)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function TaskTable({ tasks, goalMap, now, groupBySprint, selectedIds, onToggleSelect, allSelected, onToggleSelectAll, onOpenDetail }: TaskTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8 pr-3">
            <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all" />
          </TableHead>
          <TableHead className="w-8 border-r-0" />
          <TableHead>Name</TableHead>
          <TableHead>Event date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Sprint</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Goal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task, i) => {
          const goal = task.goalId ? goalMap.get(task.goalId) ?? null : null
          const showHeader = groupBySprint
            && task.sprint !== tasks[i - 1]?.sprint
            && (task.sprint || i > 0)
          return (
            <>
              {showHeader && <SprintGroupRow key={`${task.sprint}:header`} sprint={task.sprint} now={now} />}
              <TaskTableRow
                key={task.id}
                task={task}
                goal={goal}
                now={now}
                selected={selectedIds.has(task.id)}
                onToggleSelect={onToggleSelect}
                onOpenDetail={onOpenDetail}
              />
            </>
          )
        })}
      </TableBody>
    </Table>
  )
}
