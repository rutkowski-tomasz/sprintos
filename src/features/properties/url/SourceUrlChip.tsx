import { Link } from 'lucide-react'
import { Chip } from '../Chip'

export function SourceUrlChip({ url }: { url: string | null }) {
  if (!url) return null
  return (
    <Chip muted style={{ color: 'rgba(255,255,255,0.20)' }}>
      <Link size={11} />
    </Chip>
  )
}
