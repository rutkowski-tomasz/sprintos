import type { ReactNode } from 'react'
import type { Task } from '@/types'
import type { ParseResult } from './taskInputParser'
import { PropertyChip } from '@/features/properties/PropertyChip'
import { CHIP_ORDER, type ChipProperty } from '@/features/properties/registry'
import { Chip } from '@/features/properties/Chip'

const CHIP_SOURCES: Record<ChipProperty, {
  fromTask: (t: Task) => string | number | null
  fromParsed: (p: ParseResult) => string | number | null
  emptyLabel: string
}> = {
  eventDate: { fromTask: t => t.eventDate, fromParsed: p => p.eventDate?.value ?? null, emptyLabel: 'No date' },
  duration: { fromTask: t => t.duration, fromParsed: p => p.duration?.value ?? null, emptyLabel: 'No duration' },
}

export function buildTaskChips(task: Task): ReactNode[] {
  return CHIP_ORDER.flatMap(key => {
    const value = CHIP_SOURCES[key].fromTask(task)
    return value ? [<PropertyChip key={key} property={key} value={value as never} />] : []
  })
}

export function buildPreviewChips(parsed: ParseResult): ReactNode[] {
  return CHIP_ORDER.map(key => {
    const value = CHIP_SOURCES[key].fromParsed(parsed)
    return value != null
      ? <PropertyChip key={key} property={key} value={value as never} />
      : <Chip key={key}>{CHIP_SOURCES[key].emptyLabel}</Chip>
  })
}
