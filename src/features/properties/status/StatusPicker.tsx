import { useMemo, useRef, useState } from 'react'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { updateTask } from '@/features/tasks/taskActions'
import { TaskStatus, type Task } from '@/types'
import { STATUS_LABEL, ALL_STATUSES } from './statusDef'
import { StatusChip } from './StatusChip'

const DROPDOWN_H = 280

export function StatusPicker({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)

  const options = useMemo(
    () => search.trim()
      ? ALL_STATUSES.filter(s => STATUS_LABEL[s].toLowerCase().includes(search.toLowerCase()))
      : [...ALL_STATUSES],
    [search],
  )

  function close() {
    setOpen(false)
    setSearch('')
  }

  function pick(status: TaskStatus) {
    void updateTask(task.id, { status })
    close()
  }

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(o => !o)} className="inline-flex">
        <StatusChip status={task.status} />
      </button>

      {open && (
        <SearchableDropdown
          triggerRef={triggerRef}
          options={options}
          getKey={status => String(status)}
          isSelected={status => task.status === status}
          onPick={pick}
          onClose={close}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search status…"
          height={DROPDOWN_H}
          minWidth={220}
          renderOption={status => (
            <>
              <span className="shrink-0"><StatusChip status={status} /></span>
              <span className="ml-auto inline-flex items-center gap-0.5 shrink-0">
                <kbd className="inline-flex items-center justify-center rounded border border-border/60 bg-muted px-1 py-px text-[10px] font-mono text-muted-foreground leading-none">⌘</kbd>
                <kbd className="inline-flex items-center justify-center rounded border border-border/60 bg-muted px-1 py-px text-[10px] font-mono text-muted-foreground leading-none">{status + 1}</kbd>
              </span>
            </>
          )}
        />
      )}
    </>
  )
}
