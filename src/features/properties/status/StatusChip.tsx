import { STATUS_LABEL, STATUS_BADGE } from './statusDef'
import type { TaskStatus } from '@/types'

export function StatusChip({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-md leading-none border ${STATUS_BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}
