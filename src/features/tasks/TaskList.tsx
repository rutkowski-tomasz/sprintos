import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ListChecks, ArrowRightLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { TaskRow } from './TaskRow'
import { MassStatusSheet } from './MassStatusSheet'
import { MassMoveSheet } from './MassMoveSheet'
import { isSnoozed } from '@/features/properties/snooze/snoozeDef'
import { TaskStatus, type Goal, type Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
  basePath: string
}

const STATUS_RANK: Record<TaskStatus, number> = {
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.NEXT]: 1,
  [TaskStatus.TODO]: 2,
  [TaskStatus.DONE]: 3,
  [TaskStatus.ARCHIVED]: 4,
}

function compareTasks(a: Task, b: Task): number {
  const statusDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status]
  if (statusDiff !== 0) return statusDiff
  if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate)
  if (a.eventDate) return -1
  if (b.eventDate) return 1
  return 0
}

export function TaskList({ tasks, basePath }: TaskListProps) {
  const navigate = useNavigate()
  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )
  const [showSnoozed, setShowSnoozed] = useState(false)
  const now = useMemo(() => new Date(), [])

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [massStatusOpen, setMassStatusOpen] = useState(false)
  const [massMoveOpen, setMassMoveOpen] = useState(false)

  const goalMap = useMemo(() => new Map(goals.map(g => [g.id, g])), [goals])

  const { visibleTasks, snoozedIds } = useMemo(() => {
    const active: Task[] = []
    const snoozed: Task[] = []
    for (const task of tasks) {
      if (isSnoozed(task, now)) snoozed.push(task)
      else active.push(task)
    }
    active.sort(compareTasks)
    snoozed.sort(compareTasks)
    return {
      visibleTasks: showSnoozed ? [...active, ...snoozed] : active,
      snoozedIds: new Set(snoozed.map(t => t.id)),
    }
  }, [tasks, showSnoozed, now])

  function enterSelectMode(id: string) {
    setSelectMode(true)
    setSelectedIds(new Set([id]))
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
    if (next.size === 0) setSelectMode(false)
  }

  function selectAll() {
    setSelectedIds(new Set(visibleTasks.map(t => t.id)))
  }

  function openDetail(task: Task) {
    navigate(`${basePath}/${task.id}`)
  }

  const allSelected = selectedIds.size > 0 && visibleTasks.every(t => selectedIds.has(t.id))
  const selectedIdList = useMemo(() => Array.from(selectedIds), [selectedIds])

  if (!tasks.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No tasks.</p>
  }

  return (
    <div className="border-t border-border">
      {selectMode && (
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background px-3 py-2">
          <Button variant="ghost" size="icon-sm" onClick={exitSelectMode}>
            <ArrowLeft />
          </Button>
          <span className="text-sm font-medium flex-1">{selectedIds.size} selected</span>
          <Button variant="ghost" size="sm" onClick={allSelected ? exitSelectMode : selectAll}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={selectedIds.size === 0}
            aria-label="Change status"
            onClick={() => setMassStatusOpen(true)}
          >
            <ListChecks />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={selectedIds.size === 0}
            aria-label="Move"
            onClick={() => setMassMoveOpen(true)}
          >
            <ArrowRightLeft />
          </Button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {visibleTasks.map(task => {
          const snoozed = snoozedIds.has(task.id)
          return (
            <motion.div
              key={`${task.id}:${snoozed}`}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: snoozed ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              style={{ overflow: 'hidden' }}
            >
              <TaskRow
                task={task}
                goalMap={goalMap}
                now={now}
                selectMode={selectMode}
                selected={selectedIds.has(task.id)}
                onToggleSelect={toggleSelect}
                onLongPress={enterSelectMode}
                onOpenDetail={openDetail}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
      {snoozedIds.size > 0 && (
        <button
          onClick={() => setShowSnoozed(v => !v)}
          className="w-full py-3 text-center underline decoration-dashed underline-offset-2 decoration-foreground/20 text-xs text-foreground/30 hover:text-foreground active:text-foreground/50"
        >
          {showSnoozed ? `Hide snoozed tasks (${snoozedIds.size})` : `Show snoozed tasks (${snoozedIds.size})`}
        </button>
      )}

      <MassStatusSheet taskIds={selectedIdList} open={massStatusOpen} onOpenChange={setMassStatusOpen} onDone={exitSelectMode} />
      <MassMoveSheet taskIds={selectedIdList} open={massMoveOpen} onOpenChange={setMassMoveOpen} onDone={exitSelectMode} />
    </div>
  )
}
