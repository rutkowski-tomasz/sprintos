import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Copy, FileText, Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { compareSprintKeys } from '@/lib/sprintEngine'
import { formatDuration } from '@/lib/formatters'
import { deleteTask, duplicateTask, updateTask } from '@/lib/taskActions'
import { TaskStatus, type Goal, type Task } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Keys } from '@/components/ui/keys'
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
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null)

  const anchorTaskIdRef = useRef<string | null>(null)
  const shiftHeldRef = useRef(false)
  const rowIndexMapRef = useRef<Map<string, number>>(new Map())
  const kbRef = useRef({
    orderedRows: [] as Row<Task>[],
    rowSelection: {} as Record<string, boolean>,
    focusedTaskId: null as string | null,
  })

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
          onCheckedChange={v => {
            if (shiftHeldRef.current && anchorTaskIdRef.current) {
              const { orderedRows } = kbRef.current
              const clickedIdx = rowIndexMapRef.current.get(row.id) ?? 0
              const anchorIdx = rowIndexMapRef.current.get(anchorTaskIdRef.current) ?? clickedIdx
              const lo = Math.min(anchorIdx, clickedIdx)
              const hi = Math.max(anchorIdx, clickedIdx)
              setRowSelection(prev => {
                const next = { ...prev }
                for (let i = lo; i <= hi; i++) {
                  if (orderedRows[i]) next[orderedRows[i].id] = true
                }
                return next
              })
            } else {
              row.toggleSelected(!!v)
              anchorTaskIdRef.current = row.id
            }
            setFocusedTaskId(row.id)
          }}
          onClick={e => e.stopPropagation()}
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
    getRowId: row => row.id,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const orderedRows = table.getRowModel().rows
  rowIndexMapRef.current = new Map(orderedRows.map((row, idx) => [row.id, idx]))
  kbRef.current = { orderedRows, rowSelection, focusedTaskId }

  const focusedIndex = focusedTaskId ? orderedRows.findIndex(r => r.id === focusedTaskId) : -1

  useEffect(() => {
    const onShiftDown = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeldRef.current = true }
    const onShiftUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftHeldRef.current = false
        // Re-lock anchor to focused row so the next shift-arrow session starts cleanly
        anchorTaskIdRef.current = kbRef.current.focusedTaskId
      }
    }
    document.addEventListener('keydown', onShiftDown)
    document.addEventListener('keyup', onShiftUp)
    return () => {
      document.removeEventListener('keydown', onShiftDown)
      document.removeEventListener('keyup', onShiftUp)
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const { orderedRows, rowSelection, focusedTaskId } = kbRef.current
      const meta = e.metaKey || e.ctrlKey
      const tag = document.activeElement?.tagName ?? ''
      const inputFocused = tag === 'INPUT' || tag === 'TEXTAREA'

      // Cmd+1–5: change status (works even when an input is focused)
      if (meta && !e.shiftKey && e.key >= '1' && e.key <= '5') {
        const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k])
        const ids = selectedIds.length > 0 ? selectedIds : focusedTaskId ? [focusedTaskId] : []
        if (!ids.length) return
        e.preventDefault()
        const status = (Number(e.key) - 1) as TaskStatus
        void Promise.all(ids.map(id => updateTask(id, { status })))
        return
      }

      if (inputFocused) return

      if (meta && e.key.toLowerCase() === 'a') {
        if (!orderedRows.length) return
        e.preventDefault()
        const allSelected = orderedRows.every(r => rowSelection[r.id])
        if (allSelected) {
          setRowSelection({})
        } else {
          const newSel: Record<string, boolean> = {}
          orderedRows.forEach(r => { newSel[r.id] = true })
          setRowSelection(newSel)
        }
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!orderedRows.length) return
        e.preventDefault()
        const dir = e.key === 'ArrowDown' ? 1 : -1
        const curIdx = focusedTaskId
          ? orderedRows.findIndex(r => r.id === focusedTaskId)
          : dir > 0 ? -1 : orderedRows.length
        const nextIdx = Math.max(0, Math.min(orderedRows.length - 1, curIdx + dir))
        const nextRow = orderedRows[nextIdx]
        if (!nextRow) return
        setFocusedTaskId(nextRow.id)
        if (e.shiftKey) {
          // Lock the anchor on the first shift-arrow; keep it until shift is released
          if (!anchorTaskIdRef.current && focusedTaskId) {
            anchorTaskIdRef.current = focusedTaskId
          }
          const anchorId = anchorTaskIdRef.current
          if (anchorId) {
            const anchorIdx = orderedRows.findIndex(r => r.id === anchorId)
            const lo = Math.min(anchorIdx, nextIdx)
            const hi = Math.max(anchorIdx, nextIdx)
            // Replace selection with anchor→focus range so moving back shrinks it
            const newSel: Record<string, boolean> = {}
            for (let i = lo; i <= hi; i++) {
              if (orderedRows[i]) newSel[orderedRows[i].id] = true
            }
            setRowSelection(newSel)
          }
        } else {
          anchorTaskIdRef.current = nextRow.id
        }
        return
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && !meta) {
        const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k])
        const ids = selectedIds.length > 0 ? selectedIds : focusedTaskId ? [focusedTaskId] : []
        if (!ids.length) return
        e.preventDefault()
        void Promise.all(ids.map(id => deleteTask(id)))
        setRowSelection({})
        return
      }

      if (meta && e.key.toLowerCase() === 'd') {
        const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k])
        const ids = selectedIds.length > 0 ? selectedIds : focusedTaskId ? [focusedTaskId] : []
        if (!ids.length) return
        e.preventDefault()
        void Promise.all(ids.map(id => duplicateTask(id)))
        return
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  async function deleteSelected() {
    const ids = table.getFilteredSelectedRowModel().rows.map(r => r.original.id)
    await Promise.all(ids.map(id => deleteTask(id)))
    setRowSelection({})
  }

  async function duplicateSelected() {
    const ids = table.getFilteredSelectedRowModel().rows.map(r => r.original.id)
    await Promise.all(ids.map(id => duplicateTask(id)))
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
          <>
            <Button variant="outline" size="sm" className="ml-auto gap-2" onClick={duplicateSelected}>
              <Copy size={14} />
              Duplicate {selectedCount}
              <Keys meta k="D" />
            </Button>
            <Button variant="destructive" size="sm" className="gap-2" onClick={deleteSelected}>
              <Trash2 size={14} />
              Delete {selectedCount}
              <Keys k="⌫" />
            </Button>
          </>
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
            {orderedRows.length ? (
              orderedRows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={() => {
                    setFocusedTaskId(row.id)
                    if (!shiftHeldRef.current) anchorTaskIdRef.current = row.id
                  }}
                  className={`cursor-pointer${focusedIndex === idx && !row.getIsSelected() ? ' bg-muted/40' : ''}`}
                >
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
