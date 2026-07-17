import type { CSSProperties, ReactNode } from 'react'

export function Chip({
  color,
  muted,
  style,
  children,
}: {
  color?: string
  muted?: boolean
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border leading-none"
      style={{
        ...(muted
          ? { color: 'rgba(255,255,255,0.35)', borderColor: 'transparent', backgroundColor: 'transparent' }
          : color
          ? { color, borderColor: `${color}26`, backgroundColor: `${color}0a` }
          : { color: 'rgba(255,255,255,0.28)', borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'transparent' }),
        ...style,
      }}
    >
      {children}
    </span>
  )
}
