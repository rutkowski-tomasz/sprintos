import { useMemo, useRef, useState } from 'react'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import {
  classifySprintKey,
  compareSprintKeys,
  formatSprintKey,
  generateSprintKeys,
  sprintDateRange,
  sprintKeyOffset,
} from './sprintDef'
import { updateTask } from '@/features/tasks/taskActions'
import { SprintChip } from './SprintChip'
import type { Task } from '@/types'

type SprintOption =
  | { type: 'none' }
  | { type: 'sprint'; key: string; dateRange: string }

function formatShortDate(d: Date, now: Date): string {
  const day = d.getDate()
  const month = d.toLocaleString('en', { month: 'short' })
  const yr = d.getFullYear() !== now.getFullYear() ? ` '${String(d.getFullYear()).slice(-2)}` : ''
  return `${month} ${day}${yr}`
}

function toOption(key: string, now: Date): SprintOption & { type: 'sprint' } {
  const { start, end } = sprintDateRange(key)
  return {
    type: 'sprint',
    key,
    dateRange: `${formatShortDate(start, now)} – ${formatShortDate(end, now)}`,
  }
}

function buildOptions(
  assigned: string | null,
  search: string,
  now: Date,
  allKeys: string[],
): SprintOption[] {
  const none: SprintOption = { type: 'none' }

  if (!search.trim()) {
    const windowKeys = new Set<string>()
    for (let i = 0; i <= 4; i++) windowKeys.add(sprintKeyOffset(now, i))
    if (assigned) windowKeys.delete(assigned)
    const sorted = Array.from(windowKeys).sort((a, b) => compareSprintKeys(a, b))
    const sprintKeys = assigned ? [assigned, ...sorted] : sorted
    return [none, ...sprintKeys.map(k => toOption(k, now))]
  }

  const LABEL_PRIORITY: Record<string, number> = {
    current: 0, next: 1, future: 2, previous: 3, past: 4,
  }

  const q = search.toLowerCase()
  const filtered = allKeys.filter(
    k => k.toLowerCase().includes(q) || formatSprintKey(k, now).toLowerCase().includes(q),
  )
  const sorted = [...filtered].sort((a, b) => {
    const pa = LABEL_PRIORITY[classifySprintKey(a, now)]
    const pb = LABEL_PRIORITY[classifySprintKey(b, now)]
    if (pa !== pb) return pa - pb
    return classifySprintKey(a, now) === 'past'
      ? compareSprintKeys(b, a)
      : compareSprintKeys(a, b)
  })
  return [none, ...sorted.slice(0, 20).map(k => toOption(k, now))]
}

const DROPDOWN_H = 340

export function SprintPicker({ task }: { task: Task }) {
  const now = useMemo(() => new Date(), [])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)

  const allKeys = useMemo(() => generateSprintKeys(now, 1, 1), [now])
  const options = useMemo(
    () => buildOptions(task.sprint, search, now, allKeys),
    [task.sprint, search, now, allKeys],
  )

  function close() {
    setOpen(false)
    setSearch('')
  }

  function pick(option: SprintOption) {
    void updateTask(task.id, { sprint: option.type === 'none' ? null : option.key })
    close()
  }

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(o => !o)} className="inline-flex">
        <SprintChip sprint={task.sprint} now={now} />
      </button>

      {open && (
        <SearchableDropdown
          triggerRef={triggerRef}
          options={options}
          getKey={option => option.type === 'none' ? '__none__' : option.key}
          isSelected={option => option.type === 'none' ? task.sprint === null : task.sprint === option.key}
          onPick={pick}
          onClose={close}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search sprints…"
          height={DROPDOWN_H}
          minWidth={300}
          renderOption={option => option.type === 'none' ? (
            <SprintChip sprint={null} now={now} />
          ) : (
            <>
              <SprintChip sprint={option.key} now={now} />
              <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap pl-3">
                {option.dateRange}
              </span>
            </>
          )}
        />
      )}
    </>
  )
}
