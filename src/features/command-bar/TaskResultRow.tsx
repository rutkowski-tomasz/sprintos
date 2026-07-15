import type { ReactNode } from 'react'
import { ArrowDownLeft, Plus } from 'lucide-react'
import type { TaskStatus } from '@/types'
import { STATUS_LABEL, STATUS_BADGE } from '@/features/properties/status/statusDef'

interface TaskResultRowProps {
  emoji?: string
  name: string
  subtitle?: string
  status: TaskStatus
  chips?: ReactNode[]
  isPreview?: boolean
  onCopy?: (text: string) => void
  onSubmit?: () => void
  onOpen?: () => void
}

export function TaskResultRow({ emoji, name, subtitle, status, chips, isPreview, onCopy, onSubmit, onOpen }: TaskResultRowProps) {
  const hasChips = chips && chips.length > 0
  return (
    <div
      onClick={onOpen}
      className={`flex gap-3 px-4 py-3 ${hasChips ? 'items-start' : 'items-center'} ${!isPreview ? 'border-b border-white/8 last:border-0' : ''} ${onOpen ? 'cursor-pointer active:bg-white/5' : ''}`}
    >
      <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm leading-none ${emoji ? 'bg-white/5' : 'bg-muted'}${hasChips ? ' mt-0.5' : ''}`}>
        {emoji ?? ''}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{name}</p>
        {chips && chips.length > 0 && (
          <div className="flex gap-1.5 mt-1.5 overflow-x-auto">
            {chips.map((chip, i) => (
              <span key={i} className="shrink-0">{chip}</span>
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
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSubmit?.() }}
          onClick={e => e.stopPropagation()}
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="shrink-0 p-1.5 rounded-md text-white/35 hover:text-white/80 hover:bg-white/10 transition-colors self-center"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onCopy?.(name) }}
          onClick={e => e.stopPropagation()}
          aria-label="Copy to input"
        >
          <ArrowDownLeft size={16} />
        </button>
      )}
    </div>
  )
}
