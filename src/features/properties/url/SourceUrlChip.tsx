import { LinkIcon } from '@heroicons/react/24/outline'
import { Chip } from '../Chip'

export function SourceUrlChip({ url }: { url: string | null }) {
  if (!url) return null
  return (
    <Chip muted style={{ color: 'rgba(255,255,255,0.20)' }}>
      <LinkIcon className="size-[11px]" />
    </Chip>
  )
}
