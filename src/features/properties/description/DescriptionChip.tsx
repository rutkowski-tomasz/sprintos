import { AlignLeft } from 'lucide-react'
import { Chip } from '../Chip'

export function DescriptionChip({ description }: { description: string | null }) {
  if (!description) return null
  return (
    <Chip muted style={{ color: 'rgba(255,255,255,0.20)' }}>
      <AlignLeft size={11} />
    </Chip>
  )
}
