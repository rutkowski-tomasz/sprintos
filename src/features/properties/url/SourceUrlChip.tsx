import { Link } from 'lucide-react'
import { Chip } from '../Chip'

export function SourceUrlChip({ url }: { url: string | null }) {
  if (!url) return null
  return (
    <Chip muted>
      <Link size={11} />
    </Chip>
  )
}
