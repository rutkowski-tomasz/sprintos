import { Copy } from 'lucide-react'
import type { Task } from '@/types'
import { STATUS_LABEL, STATUS_BADGE } from '@/features/properties/status/TaskStatus'

interface SuggestionProps {
  task: Task
  onCopy: (text: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86_400_000)
  return `${days}d ago`
}

export function Suggestion({ task, onCopy }: SuggestionProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 last:border-0">
      <span className="text-lg w-6 text-center leading-none shrink-0">{task.emoji ?? ''}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">{task.name}</p>
        <p className="text-[11px] text-white/40 mt-0.5">{timeAgo(task.updatedAt)}</p>
      </div>

      <span className={`text-xs px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[task.status]}`}>
        {STATUS_LABEL[task.status]}
      </span>

      <button
        type="button"
        className="shrink-0 p-1.5 rounded-md text-white/35 hover:text-white/80 hover:bg-white/10 transition-colors"
        onMouseDown={e => {
          e.preventDefault()
          onCopy(task.name)
        }}
        aria-label="Copy to input"
      >
        <Copy size={13} />
      </button>
    </div>
  )
}
