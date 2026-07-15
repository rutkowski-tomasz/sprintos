import { cn } from '@/lib/utils'
import { SPRINT_LABEL_TEXT, type SprintLabel } from './sprintDef'

const CAPSULE_CLASS: Record<SprintLabel, string> = {
  current: 'border-blue-400 bg-blue-500/10 text-blue-300',
  next: 'border-purple-400 bg-purple-500/10 text-purple-300',
  previous: 'border-amber-400 bg-amber-500/10 text-amber-300',
  future: 'border-zinc-400 bg-zinc-500/10 text-zinc-300',
  past: 'border-zinc-600 bg-zinc-400/10 text-zinc-500',
}

const DOT_CLASS: Record<SprintLabel, string> = {
  current: 'bg-blue-300',
  next: 'bg-purple-300',
  previous: 'bg-amber-300',
  future: 'bg-zinc-300',
  past: 'bg-zinc-500',
}

export function SprintBadge({ label }: { label: SprintLabel }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shrink-0',
        CAPSULE_CLASS[label],
      )}
    >
      <span className={cn('size-1 rounded-full shrink-0', DOT_CLASS[label])} />
      <span className="text-[9px] font-bold tracking-widest uppercase leading-none">
        {SPRINT_LABEL_TEXT[label]}
      </span>
    </div>
  )
}
