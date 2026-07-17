import type { ReactNode } from 'react'
import { ArrowDownLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { TaskStatus } from '@/types'
import { StatusChip } from '@/features/properties/status/StatusChip'

interface TaskResultRowProps {
  emoji?: string
  name: string
  subtitle?: ReactNode
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
      onMouseDown={isPreview ? e => e.preventDefault() : undefined}
      onClick={isPreview ? onSubmit : onOpen}
      className={`flex gap-3 px-4 py-3 ${hasChips ? 'items-start' : 'items-center'} ${!isPreview ? 'border-b border-white/8 last:border-0' : ''} ${isPreview || onOpen ? 'cursor-pointer active:bg-white/5' : ''}`}
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
        <StatusChip status={status} />
        {subtitle && <div className="text-[11px] text-white/40">{subtitle}</div>}
      </div>

      {isPreview ? (
        <button
          type="button"
          className="shrink-0 p-1.5 text-white/35 self-center hover:text-white/70 transition-colors"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSubmit?.() }}
          onClick={e => e.stopPropagation()}
          aria-label="Add task"
        >
          <PlusIcon className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          className="shrink-0 p-1.5 rounded-md text-white/35 hover:text-white/80 hover:bg-white/10 transition-colors self-center"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onCopy?.(name) }}
          onClick={e => e.stopPropagation()}
          aria-label="Copy to input"
        >
          <ArrowDownLeftIcon className="size-4" />
        </button>
      )}
    </div>
  )
}
