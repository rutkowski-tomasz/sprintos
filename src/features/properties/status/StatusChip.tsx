import { Chip } from '../Chip'
import { STATUS_LABEL, STATUS_CHIP_COLOR } from './statusDef'
import type { TaskStatus } from '@/types'

export function StatusChip({ status }: { status: TaskStatus }) {
  return <Chip color={STATUS_CHIP_COLOR[status]}>{STATUS_LABEL[status]}</Chip>
}
