import { cn } from '@/lib/utils'
import { SPRINT_LABEL_COLOR, SPRINT_LABEL_TEXT, type SprintLabel } from './sprintDef'

export function SprintBadge({ label }: { label: SprintLabel }) {
  const color = SPRINT_LABEL_COLOR[label]
  return (
    <div
      className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shrink-0')}
      style={{ borderColor: `${color}66`, backgroundColor: `${color}1a`, color }}
    >
      <span className="size-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[9px] font-bold tracking-widest uppercase leading-none">
        {SPRINT_LABEL_TEXT[label]}
      </span>
    </div>
  )
}
