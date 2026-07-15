import { useEffect, useRef, type RefObject } from 'react'
import { useMotionValue, type MotionValue } from 'motion/react'

export const EXPANDED_HEIGHT = 112
export const COLLAPSED_HEIGHT = 56
export const COLLAPSE_RANGE = EXPANDED_HEIGHT - COLLAPSED_HEIGHT

export function useSprintCollapseT(scrollContainerRef?: RefObject<HTMLDivElement | null>): MotionValue<number> {
  const fallbackRef = useRef<HTMLDivElement>(null)
  const collapseT = useMotionValue(0)

  useEffect(() => {
    const el = scrollContainerRef?.current ?? fallbackRef.current
    if (!el) return

    const updateCollapse = () => {
      const sy = Math.max(0, el.scrollTop)
      const maxScroll = el.scrollHeight - el.clientHeight
      const atBottom = maxScroll > 0 && sy >= maxScroll - 0.5
      collapseT.set(atBottom ? 1 : Math.min(1, sy / COLLAPSE_RANGE))
    }

    updateCollapse()
    el.addEventListener('scroll', updateCollapse, { passive: true })
    return () => el.removeEventListener('scroll', updateCollapse)
  }, [scrollContainerRef, collapseT])

  return collapseT
}
