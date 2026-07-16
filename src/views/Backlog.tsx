import { useCallback, useMemo, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ViewHeader } from '@/features/navigation/ViewHeader'
import { TaskList } from '@/features/tasks/TaskList'
import { TaskDetailPage } from '@/features/tasks/TaskDetailPage'
import { useBacklogTasks } from '@/features/tasks/useBacklogTasks'
import { usePullToRefresh } from '@/features/tasks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/features/tasks/PullToRefreshIndicator'
import { refreshData } from '@/features/sync/sync'

export function Backlog() {
  const { taskId } = useParams<{ taskId?: string }>()
  const tasks = useBacklogTasks()
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = useMemo(() => new Date(), [])
  const location = useLocation()
  const basePath = taskId ? location.pathname.slice(0, -(taskId.length + 1)) : location.pathname
  const handleRefresh = useCallback(() => refreshData(), [])
  const { pullY, bounceY, refreshing } = usePullToRefresh(scrollRef, handleRefresh)

  return (
    <div className="h-full flex flex-col relative">
      <ViewHeader viewName="Backlog" />
      <div ref={scrollRef} className="flex-1 overflow-auto overscroll-contain pb-safe-nav">
        <motion.div style={{ y: bounceY }}>
          <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
          {tasks && <TaskList tasks={tasks} basePath={basePath} scrollContainerRef={scrollRef} groupBySprint />}
          <div className="h-24" />
        </motion.div>
      </div>
      <AnimatePresence>
        {taskId && <TaskDetailPage key={taskId} taskId={taskId} now={now} listPath={basePath} />}
      </AnimatePresence>
    </div>
  )
}
