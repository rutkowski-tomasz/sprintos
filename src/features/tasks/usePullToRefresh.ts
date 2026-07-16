import { useEffect, useRef, useState, type RefObject } from 'react'
import { animate, useMotionValue, type MotionValue } from 'motion/react'

const PULL_THRESHOLD = 64
const MAX_PULL = 96
const PULL_RESISTANCE = 0.5

const MAX_BOUNCE = 56
const BOUNCE_RESISTANCE = 0.4

interface PullToRefreshResult {
  pullY: MotionValue<number>
  bounceY: MotionValue<number>
  refreshing: boolean
}

type EdgeMode = 'none' | 'top' | 'bottom'

export function usePullToRefresh(
  scrollRef: RefObject<HTMLDivElement | null>,
  onRefresh: () => Promise<void>,
): PullToRefreshResult {
  const pullY = useMotionValue(0)
  const bounceY = useMotionValue(0)
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef = useRef(false)
  const startY = useRef<number | null>(null)
  const mode = useRef<EdgeMode>('none')

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current) {
        mode.current = 'none'
        return
      }
      const atTop = el!.scrollTop <= 0
      const atBottom = el!.scrollTop + el!.clientHeight >= el!.scrollHeight - 0.5
      if (atTop) mode.current = 'top'
      else if (atBottom) mode.current = 'bottom'
      else mode.current = 'none'
      startY.current = mode.current === 'none' ? null : e.touches[0].clientY
    }

    function onTouchMove(e: TouchEvent) {
      if (mode.current === 'none' || startY.current === null || refreshingRef.current) return
      const dy = e.touches[0].clientY - startY.current

      if (mode.current === 'top') {
        if (dy <= 0 || el!.scrollTop > 0) {
          mode.current = 'none'
          pullY.set(0)
          return
        }
        e.preventDefault()
        pullY.set(Math.min(MAX_PULL, dy * PULL_RESISTANCE))
        return
      }

      if (dy >= 0 || el!.scrollTop + el!.clientHeight < el!.scrollHeight - 0.5) {
        mode.current = 'none'
        bounceY.set(0)
        return
      }
      e.preventDefault()
      bounceY.set(-Math.min(MAX_BOUNCE, -dy * BOUNCE_RESISTANCE))
    }

    function onTouchEnd() {
      if (mode.current === 'top') {
        if (pullY.get() >= PULL_THRESHOLD) {
          refreshingRef.current = true
          setRefreshing(true)
          animate(pullY, PULL_THRESHOLD * 0.72, { type: 'spring', stiffness: 420, damping: 38 })
          onRefresh().finally(() => {
            refreshingRef.current = false
            setRefreshing(false)
            animate(pullY, 0, { type: 'spring', stiffness: 420, damping: 38 })
          })
        } else {
          animate(pullY, 0, { type: 'spring', stiffness: 520, damping: 40 })
        }
      } else if (mode.current === 'bottom') {
        animate(bounceY, 0, { type: 'spring', stiffness: 500, damping: 32 })
      }
      mode.current = 'none'
      startY.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [scrollRef, onRefresh, pullY, bounceY])

  return { pullY, bounceY, refreshing }
}

export { PULL_THRESHOLD }
