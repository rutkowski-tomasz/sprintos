import { ArrowDownLeft, Plus } from 'lucide-react'
import type { TaskStatus } from '@/types'
import { STATUS_LABEL, STATUS_BADGE } from '@/features/properties/status/TaskStatus'

interface TaskRowProps {
  emoji?: string
  name: string
  subtitle?: string
  status: TaskStatus
  isPreview?: boolean
  onCopy?: (text: string) => void
}

export function TaskRow({ emoji, name, subtitle, status, isPreview, onCopy }: TaskRowProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isPreview ? '' : 'border-b border-white/8 last:border-0'}`}>
      {isPreview ? (
        <div className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm leading-none bg-white/5">
          {emoji ?? ''}
        </div>
      ) : (
        <span className="text-lg w-7 h-7 flex items-center justify-center leading-none shrink-0">{emoji ?? ''}</span>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">{name}</p>
        {subtitle && <p className="text-[11px] text-white/40 mt-0.5">{subtitle}</p>}
      </div>

      <span className={`text-xs px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[status]}`}>
        {STATUS_LABEL[status]}
      </span>

      {isPreview ? (
        <div className="shrink-0 p-1.5 text-white/35">
          <Plus size={16} />
        </div>
      ) : (
        <button
          type="button"
          className="shrink-0 p-1.5 rounded-md text-white/35 hover:text-white/80 hover:bg-white/10 transition-colors"
          onMouseDown={e => {
            e.preventDefault()
            onCopy?.(name)
          }}
          aria-label="Copy to input"
        >
          <ArrowDownLeft size={16} />
        </button>
      )}
    </div>
  )
}
