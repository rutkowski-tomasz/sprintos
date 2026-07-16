import { useState } from 'react'
import { ChevronRight, TriangleAlert, Link, AlignLeft } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { DurationChip } from '@/features/properties/duration/DurationChip'
import { EventDateChip } from '@/features/properties/event-date/EventDateChip'
import { GoalChip } from '@/features/properties/goal/GoalChip'
import { StatusPicker } from '@/features/properties/status/StatusPicker'
import { SprintPicker } from '@/features/properties/sprint/SprintPicker'
import { toDatetimeLocal } from '@/features/properties/event-date/eventDateDef'
import { formatDuration, parseDurationText } from '@/features/properties/duration/durationDef'
import { isEventDateMisaligned } from '@/features/properties/sprint/sprintDef'
import { updateTask } from './taskActions'
import type { Goal, Task } from '@/types'

interface TaskTableRowProps {
  task: Task
  goal: Goal | null
  now: Date
  selected: boolean
  onToggleSelect: (id: string) => void
  onOpenDetail: (task: Task) => void
}

export function TaskTableRow({ task, goal, now, selected, onToggleSelect, onOpenDetail }: TaskTableRowProps) {
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [eventDateLocal, setEventDateLocal] = useState('')
  const [editingDuration, setEditingDuration] = useState(false)
  const [durationText, setDurationText] = useState('')

  function startEditingName() {
    setName(task.name)
    setEditingName(true)
  }

  function saveName() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== task.name) void updateTask(task.id, { name: trimmed })
    setEditingName(false)
  }

  function startEditingDate() {
    setEventDateLocal(task.eventDate ? toDatetimeLocal(task.eventDate) : '')
    setEditingDate(true)
  }

  function saveEventDate() {
    const iso = eventDateLocal ? new Date(eventDateLocal).toISOString() : null
    if (iso !== task.eventDate) void updateTask(task.id, { eventDate: iso })
    setEditingDate(false)
  }

  function startEditingDuration() {
    setDurationText(task.duration ? formatDuration(task.duration) : '')
    setEditingDuration(true)
  }

  function saveDuration() {
    const seconds = parseDurationText(durationText, now)
    if (seconds !== task.duration) void updateTask(task.id, { duration: seconds })
    setEditingDuration(false)
  }

  const misaligned = !!(task.eventDate && task.sprint && isEventDateMisaligned(task.eventDate, task.sprint))

  return (
    <TableRow className="group" data-state={selected ? 'selected' : undefined}>
      <TableCell className="pr-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(task.id)}
          aria-label={`Select ${task.name}`}
          className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 focus-visible:opacity-100"
        />
      </TableCell>
      <TableCell className="text-base leading-none border-r-0">{task.emoji ?? ''}</TableCell>
      <TableCell
        className="max-w-0 w-full whitespace-normal cursor-pointer"
        onClick={() => !editingName && startEditingName()}
      >
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
            onClick={e => e.stopPropagation()}
            className="w-full rounded px-1 -mx-1 py-0.5 bg-muted/60 border-0 outline-none text-sm"
          />
        ) : (
          <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
            <p className="truncate">{task.name}</p>
            {(task.sourceUrl || task.description) && (
              <span className="inline-flex items-center gap-1 shrink-0 text-muted-foreground/35">
                {task.sourceUrl && <Link size={11} />}
                {task.description && <AlignLeft size={11} />}
              </span>
            )}
          </span>
        )}
      </TableCell>
      <TableCell className="cursor-pointer" onClick={() => !editingDate && startEditingDate()}>
        {editingDate ? (
          <input
            type="datetime-local"
            autoFocus
            value={eventDateLocal}
            onChange={e => setEventDateLocal(e.target.value)}
            onBlur={saveEventDate}
            onClick={e => e.stopPropagation()}
            className="bg-transparent border-0 outline-none text-sm"
          />
        ) : task.eventDate ? (
          <span className="inline-flex items-center gap-1">
            <EventDateChip date={task.eventDate} now={now} />
            {misaligned && (
              <span title="Event date is outside the assigned sprint" className="shrink-0 flex">
                <TriangleAlert size={12} className="text-muted-foreground/50" />
              </span>
            )}
          </span>
        ) : null}
      </TableCell>
      <TableCell className="cursor-pointer" onClick={e => e.stopPropagation()}>
        <StatusPicker task={task} />
      </TableCell>
      <TableCell className="cursor-pointer" onClick={e => e.stopPropagation()}>
        <SprintPicker task={task} />
      </TableCell>
      <TableCell className="cursor-pointer" onClick={() => !editingDuration && startEditingDuration()}>
        {editingDuration ? (
          <input
            autoFocus
            value={durationText}
            onChange={e => setDurationText(e.target.value)}
            onBlur={saveDuration}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
            onClick={e => e.stopPropagation()}
            placeholder="e.g. 1h30m"
            className="w-20 bg-transparent border-0 outline-none text-sm"
          />
        ) : task.duration ? (
          <DurationChip seconds={task.duration} />
        ) : null}
      </TableCell>
      <TableCell>{goal ? <GoalChip goal={goal} /> : null}</TableCell>
      <TableCell>
        <Button variant="ghost" size="icon-sm" aria-label="Open task" onClick={() => onOpenDetail(task)}>
          <ChevronRight />
        </Button>
      </TableCell>
    </TableRow>
  )
}
