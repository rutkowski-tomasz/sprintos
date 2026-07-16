import { useMemo, useState, type RefObject } from 'react'
import { AnimatePresence, motion, useTransform } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ListChecks, ArrowRightLeft, Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { useNow } from '@/lib/useNow'
import { Button } from '@/components/ui/button'
import { TaskRow } from './TaskRow'
import { MassStatusSheet } from './MassStatusSheet'
import { MassMoveSheet } from './MassMoveSheet'
import { deleteTasks } from './taskActions'
import { isSnoozed } from '@/features/properties/snooze/snoozeDef'
import { useSprintCollapseT, EXPANDED_HEIGHT, COLLAPSE_RANGE } from '@/features/navigation/sprintHeaderCollapse'
import { classifySprintKey, compareSprintKeys, formatSprintKey, SPRINT_LABEL_COLOR, SPRINT_LABEL_TEXT } from '@/features/properties/sprint/sprintDef'
import { TaskStatus, type Goal, type Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
  basePath: string
  scrollContainerRef?: RefObject<HTMLDivElement | null>
  groupBySprint?: boolean
}

function SprintGroupHeader({ sprint, now }: { sprint: string | null; now: Date }) {
  if (!sprint) {
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-background">
        <span className="size-1 rounded-full shrink-0 bg-muted-foreground/35" />
        <span className="text-[10px] font-bold tracking-widest uppercase leading-none text-muted-foreground/35">
          Backlog
        </span>
      </div>
    )
  }
  const label = classifySprintKey(sprint, now)
  const color = SPRINT_LABEL_COLOR[label]
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-background">
      <span className="size-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold tracking-widest uppercase leading-none" style={{ color }}>
        {SPRINT_LABEL_TEXT[label]} · Sprint {formatSprintKey(sprint, now)}
      </span>
    </div>
  )
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
  return a.name.localeCompare(b.name)
}

function compareBySprintGroup(a: Task, b: Task): number {
  if (a.sprint !== b.sprint) {
    if (!a.sprint) return 1
    if (!b.sprint) return -1
    return compareSprintKeys(a.sprint, b.sprint)
  }
  return compareTasks(a, b)
}

export function TaskList({ tasks, basePath, scrollContainerRef, groupBySprint }: TaskListProps) {
  const navigate = useNavigate()
  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )
  const [showSnoozed, setShowSnoozed] = useState(false)
  const now = useNow()
  const collapseT = useSprintCollapseT(scrollContainerRef)
  const toolbarTop = useTransform(collapseT, t => EXPANDED_HEIGHT - t * COLLAPSE_RANGE)

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
    const sorter = groupBySprint ? compareBySprintGroup : compareTasks
    active.sort(sorter)
    snoozed.sort(sorter)
    return {
      visibleTasks: showSnoozed ? [...active, ...snoozed] : active,
      snoozedIds: new Set(snoozed.map(t => t.id)),
    }
  }, [tasks, showSnoozed, now, groupBySprint])

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

  function deleteSelected() {
    if (!window.confirm(`Delete ${selectedIds.size} task${selectedIds.size === 1 ? '' : 's'}?`)) return
    void deleteTasks(selectedIdList)
    exitSelectMode()
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
        <>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 opacity-0 pointer-events-none" aria-hidden="true">
            <Button variant="ghost" size="icon-sm"><ArrowLeft /></Button>
          </div>
          <motion.div
            style={{ top: toolbarTop }}
            className="absolute left-0 right-0 z-20 flex items-center gap-2 border-b border-border bg-background px-3 py-2"
          >
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
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={selectedIds.size === 0}
              aria-label="Delete"
              onClick={deleteSelected}
            >
              <Trash2 />
            </Button>
          </motion.div>
        </>
      )}

      <AnimatePresence initial={false}>
        {visibleTasks.map((task, i) => {
          const snoozed = snoozedIds.has(task.id)
          const showHeader = groupBySprint
            && task.sprint !== visibleTasks[i - 1]?.sprint
            && (task.sprint || i > 0)
          return (
            <motion.div
              key={`${task.id}:${snoozed}`}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: snoozed ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              style={{ overflow: 'hidden' }}
            >
              {showHeader && <SprintGroupHeader sprint={task.sprint} now={now} />}
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
