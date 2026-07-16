import { useCallback, useMemo, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ViewHeader, SPRINT_HEADER_INSET } from '@/features/navigation/ViewHeader'
import { TaskList } from '@/features/tasks/TaskList'
import { TaskDetailPage } from '@/features/tasks/TaskDetailPage'
import { useSprintTasks } from '@/features/tasks/useSprintTasks'
import { usePullToRefresh } from '@/features/tasks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/features/tasks/PullToRefreshIndicator'
import { refreshData } from '@/features/sync/sync'
import { sprintKeyFromRouteParam } from '@/features/properties/sprint/sprintDef'

export function SprintView() {
  const { key: param, taskId } = useParams<{ key: string; taskId?: string }>()
  const key = sprintKeyFromRouteParam(param ?? 'current', new Date())
  const tasks = useSprintTasks(key)
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = useMemo(() => new Date(), [])
  const location = useLocation()
  const basePath = taskId ? location.pathname.slice(0, -(taskId.length + 1)) : location.pathname
  const handleRefresh = useCallback(() => refreshData(), [])
  const { pullY, bounceY, refreshing } = usePullToRefresh(scrollRef, handleRefresh)

  return (
    <div className="h-full flex flex-col relative">
      <ViewHeader viewName="Sprint" sprintKey={key} scrollContainerRef={scrollRef} tasks={tasks ?? []} />
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto overscroll-contain pb-safe-nav"
        style={{ paddingTop: SPRINT_HEADER_INSET }}
      >
        <motion.div style={{ y: bounceY }}>
          <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
          {tasks && <TaskList tasks={tasks} basePath={basePath} scrollContainerRef={scrollRef} />}
          <div className="h-24" />
        </motion.div>
      </div>
      <AnimatePresence>
        {taskId && <TaskDetailPage key={taskId} taskId={taskId} now={now} listPath={basePath} />}
      </AnimatePresence>
    </div>
  )
}
