import { Bars3BottomLeftIcon } from '@heroicons/react/24/outline'
import { Chip } from '../Chip'

export function DescriptionChip({ description }: { description: string | null }) {
  if (!description) return null
  return (
    <Chip muted style={{ color: 'rgba(255,255,255,0.20)' }}>
      <Bars3BottomLeftIcon className="size-[11px]" />
    </Chip>
  )
}
