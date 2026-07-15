import { AlignLeft } from 'lucide-react'
import { Chip } from '../Chip'
import { DESCRIPTION_COLOR } from './descriptionDef'

export function DescriptionChip({ description }: { description: string | null }) {
  if (!description) return null
  return (
    <Chip color={DESCRIPTION_COLOR}>
      <AlignLeft size={11} />
    </Chip>
  )
}
