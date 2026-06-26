import { ArrowDownLeft, Plus } from 'lucide-react'
import type { TaskStatus } from '@/types'
import { STATUS_LABEL, STATUS_BADGE } from '@/features/properties/status/TaskStatus'

export interface TaskChip {
  label: string
  color?: string
}

interface TaskRowProps {
  emoji?: string
  name: string
  subtitle?: string
  status: TaskStatus
  chips?: TaskChip[]
  isPreview?: boolean
  onCopy?: (text: string) => void
  onSubmit?: () => void
}

export function TaskRow({ emoji, name, subtitle, status, chips, isPreview, onCopy, onSubmit }: TaskRowProps) {
  const hasChips = chips && chips.length > 0
  return (
    <div className={`flex gap-3 px-4 py-3 ${hasChips ? 'items-start' : 'items-center'} ${!isPreview ? 'border-b border-white/8 last:border-0' : ''}`}>
      <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm leading-none bg-white/5${hasChips ? ' mt-0.5' : ''}`}>
        {emoji ?? ''}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{name}</p>
        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {chips.map((chip, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-md border"
                style={chip.color
                  ? { color: chip.color, borderColor: `${chip.color}40`, backgroundColor: `${chip.color}12` }
                  : { color: 'rgba(255,255,255,0.28)', borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'transparent' }
                }
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        {subtitle && <p className="text-[11px] text-white/40">{subtitle}</p>}
      </div>

      {isPreview ? (
        <button
          type="button"
          className="shrink-0 p-1.5 text-white/35 self-center hover:text-white/70 transition-colors"
          onMouseDown={e => { e.preventDefault(); onSubmit?.() }}
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="shrink-0 p-1.5 rounded-md text-white/35 hover:text-white/80 hover:bg-white/10 transition-colors self-center"
          onMouseDown={e => { e.preventDefault(); onCopy?.(name) }}
          aria-label="Copy to input"
        >
          <ArrowDownLeft size={16} />
        </button>
      )}
    </div>
  )
}
