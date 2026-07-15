import { Link } from 'lucide-react'
import { Chip } from '../Chip'
import { URL_COLOR } from './urlDef'

export function SourceUrlChip({ url }: { url: string | null }) {
  if (!url) return null
  return (
    <Chip color={URL_COLOR}>
      <Link size={11} />
    </Chip>
  )
}
