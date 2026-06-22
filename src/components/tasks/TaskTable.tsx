import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, FileText, Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { compareSprintKeys } from '@/lib/sprintEngine'
import { formatDuration } from '@/lib/formatters'
import { updateTask } from '@/lib/taskActions'
import { TaskStatus, type Goal, type Task } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const STATUS_LABEL: Record<number, string> = {
  [TaskStatus.TODO]: 'To-Do',
  [TaskStatus.NEXT]: 'Next',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.ARCHIVED]: 'Archived',
}

const STATUS_BADGE: Record<number, string> = {
  [TaskStatus.TODO]: 'bg-zinc-500/15 text-zinc-400 border-transparent',
  [TaskStatus.NEXT]: 'bg-purple-500/15 text-purple-400 border-transparent',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-500/15 text-blue-400 border-transparent',
  [TaskStatus.DONE]: 'bg-emerald-500/15 text-emerald-400 border-transparent',
  [TaskStatus.ARCHIVED]: 'bg-zinc-400/10 text-zinc-500 border-transparent',
}

function SortableHeader({ column, children }: {
  column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' }
  children: React.ReactNode
}) {
  return (
    <button
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      <ArrowUpDown size={11} />
    </button>
  )
}

function NameCell({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false)

  function save(value: string) {
    const trimmed = value.trim()
    if (trimmed && trimmed !== task.name) updateTask(task.id, { name: trimmed })
  }

  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={task.name}
        onBlur={e => { save(e.target.value); setEditing(false) }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') { e.currentTarget.value = task.name; e.currentTarget.blur() }
        }}
        className="w-full bg-transparent outline-none border-b border-border text-sm"
      />
    )
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="truncate cursor-text" onClick={() => setEditing(true)}>{task.name}</span>
      {task.sourceUrl && (
        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          OPEN
        </span>
      )}
      {task.description && <FileText size={12} className="shrink-0 text-muted-foreground/40" />}
    </div>
  )
}

function StatusCell({ task }: { task: Task }) {
  return (
    <div className="relative inline-flex">
      <Badge className={STATUS_BADGE[task.status]}>{STATUS_LABEL[task.status]}</Badge>
      <select
        value={task.status}
        onChange={e => updateTask(task.id, { status: Number(e.target.value) as TaskStatus })}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Task status"
      >
        {Object.entries(STATUS_LABEL).map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </div>
  )
}

const COL_WIDTHS: Partial<Record<string, number>> = {
  select:   40,
  emoji:    36,
  // name: flexible — takes remaining width
  status:  110,
  goalId:  180,
  duration: 72,
  sprint:   80,
}

interface TaskTableProps {
  tasks: Task[]
}

export function TaskTable({ tasks }: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )

  const columns = useMemo<ColumnDef<Task>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'emoji',
      header: () => null,
      cell: ({ row }) => (
        <span className="block w-5 text-center leading-none">{row.original.emoji ?? ''}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>Task name</SortableHeader>,
      cell: ({ row }) => <NameCell task={row.original} />,
      filterFn: 'includesString',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => <StatusCell task={row.original} />,
      filterFn: (row, _id, filterValue) =>
        !filterValue ? true : row.getValue('status') === Number(filterValue),
    },
    {
      accessorKey: 'goalId',
      header: ({ column }) => <SortableHeader column={column}>Goal</SortableHeader>,
      cell: ({ row }) => {
        const goal = goals?.find(g => g.id === row.getValue<string | null>('goalId'))
        if (!goal) return <span className="text-muted-foreground/30">—</span>
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            {goal.emoji && <span className="shrink-0">{goal.emoji}</span>}
            <span className="truncate text-sm">{goal.name}</span>
          </span>
        )
      },
      filterFn: (row, _id, filterValue) =>
        !filterValue ? true : row.getValue('goalId') === filterValue,
      sortingFn: (a, b) => {
        const nameA = goals?.find(g => g.id === a.getValue<string | null>('goalId'))?.name ?? ''
        const nameB = goals?.find(g => g.id === b.getValue<string | null>('goalId'))?.name ?? ''
        return nameA.localeCompare(nameB)
      },
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => <SortableHeader column={column}>Duration</SortableHeader>,
      cell: ({ row }) => {
        const d = row.getValue<number | null>('duration')
        if (!d) return <span className="text-muted-foreground/30">—</span>
        return <span className="text-sm text-muted-foreground">{formatDuration(d)}</span>
      },
    },
    {
      accessorKey: 'sprint',
      header: ({ column }) => <SortableHeader column={column}>Sprint</SortableHeader>,
      cell: ({ row }) => {
        const sprint = row.getValue<string | null>('sprint')
        if (!sprint) return <span className="text-muted-foreground/30">—</span>
        return <span className="text-sm text-muted-foreground">{sprint.replace(/^\d+ /, '')}</span>
      },
      sortingFn: (a, b) => {
        const ak = a.getValue<string | null>('sprint')
        const bk = b.getValue<string | null>('sprint')
        if (!ak && !bk) return 0
        if (!ak) return 1
        if (!bk) return -1
        return compareSprintKeys(ak, bk)
      },
    },
  ], [goals])

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  async function deleteSelected() {
    const ids = table.getFilteredSelectedRowModel().rows.map(r => r.original.id)
    const now = new Date().toISOString()
    await Promise.all(ids.map(id => updateTask(id, { deletedAt: now })))
    setRowSelection({})
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search tasks…"
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
          className="h-8 max-w-xs text-sm"
        />
        <Select
          value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
          onValueChange={v => table.getColumn('status')?.setFilterValue(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABEL).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {goals && goals.length > 0 && (
          <Select
            value={(table.getColumn('goalId')?.getFilterValue() as string) ?? ''}
            onValueChange={v => table.getColumn('goalId')?.setFilterValue(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="Goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All goals</SelectItem>
              {goals.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.emoji ? `${g.emoji} ${g.name}` : g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedCount > 0 && (
          <Button variant="destructive" size="sm" className="ml-auto" onClick={deleteSelected}>
            <Trash2 />
            Delete {selectedCount}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id} style={COL_WIDTHS[h.column.id] ? { width: COL_WIDTHS[h.column.id] } : undefined}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="overflow-hidden">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-16 text-center text-muted-foreground text-sm">
                  No tasks.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
