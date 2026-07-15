import { AlignLeft } from 'lucide-react'
import { Chip } from '../Chip'

export function DescriptionChip({ description }: { description: string | null }) {
  if (!description) return null
  return (
    <Chip muted>
      <AlignLeft size={11} />
    </Chip>
  )
}
