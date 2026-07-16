import { motion, useTransform, type MotionValue } from 'motion/react'
import { RefreshCw } from 'lucide-react'
import { PULL_THRESHOLD } from './usePullToRefresh'

interface PullToRefreshIndicatorProps {
  pullY: MotionValue<number>
  refreshing: boolean
}

export function PullToRefreshIndicator({ pullY, refreshing }: PullToRefreshIndicatorProps) {
  const height = useTransform(pullY, v => Math.min(v, PULL_THRESHOLD * 0.72))
  const opacity = useTransform(pullY, [0, 16], [0, 1])
  const scale = useTransform(pullY, [0, PULL_THRESHOLD], [0.5, 1])
  const rotate = useTransform(pullY, [0, PULL_THRESHOLD], [0, 180])

  return (
    <motion.div style={{ height }} className="flex items-center justify-center overflow-hidden">
      <motion.div style={{ opacity, scale, rotate: refreshing ? 0 : rotate }}>
        <RefreshCw
          size={16}
          strokeWidth={2.5}
          className={refreshing ? 'text-muted-foreground animate-spin' : 'text-muted-foreground'}
        />
      </motion.div>
    </motion.div>
  )
}
