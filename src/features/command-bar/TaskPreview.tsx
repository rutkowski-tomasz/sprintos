import { Plus } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import type { Goal } from '@/types'
import { TaskStatus } from '@/types'
import { STATUS_LABEL, STATUS_BADGE } from '@/features/properties/status/TaskStatus'
import { parseTaskInput } from './taskInputParser'
import { sprintKey, sprintKeyOffset, formatSprintKey } from '@/features/properties/sprints/sprintEngine'

interface TaskPreviewProps {
  inputValue: string
  goals: Goal[]
}

function sprintLabelForPath(pathname: string): string | null {
  const now = new Date()
  if (pathname === '/current') return `Sprint ${formatSprintKey(sprintKey(now), now)}`
  if (pathname === '/next') return `Sprint ${formatSprintKey(sprintKeyOffset(now, 1), now)}`
  if (pathname === '/backlog') return 'Backlog'
  return null
}

export function TaskPreview({ inputValue, goals }: TaskPreviewProps) {
  const location = useLocation()
  const sprintLabel = sprintLabelForPath(location.pathname)
  const parsed = parseTaskInput(inputValue, goals)
  const name = parsed.name || 'Untitled'
  const status = parsed.status ?? TaskStatus.TODO

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm leading-none bg-white/5">
        {parsed.emoji ?? ''}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">{name}</p>
        {sprintLabel && <p className="text-[11px] text-white/40 mt-0.5">{sprintLabel}</p>}
      </div>

      <span className={`text-xs px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[status]}`}>
        {STATUS_LABEL[status]}
      </span>

      <Plus className="w-5 h-5 shrink-0 text-white/35" />
    </div>
  )
}
