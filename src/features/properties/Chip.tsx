import type { ReactNode } from 'react'

export function Chip({ color, children }: { color?: string; children: ReactNode }) {
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-md border"
      style={color
        ? { color, borderColor: `${color}40`, backgroundColor: `${color}12` }
        : { color: 'rgba(255,255,255,0.28)', borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'transparent' }}
    >
      {children}
    </span>
  )
}
