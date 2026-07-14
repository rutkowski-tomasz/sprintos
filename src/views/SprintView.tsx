import { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { ViewHeader, SPRINT_HEADER_INSET } from '@/features/navigation/ViewHeader'
import { TaskList } from '@/features/tasks/TaskList'
import { useSprintTasks } from '@/features/tasks/useSprintTasks'
import { sprintKeyFromRouteParam } from '@/features/properties/sprint/sprintDef'

export function SprintView() {
  const { key: param } = useParams<{ key: string }>()
  const key = sprintKeyFromRouteParam(param ?? 'current', new Date())
  const tasks = useSprintTasks(key)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!tasks) return null

  return (
    <div className="h-full flex flex-col">
      <ViewHeader viewName="Sprint" sprintKey={key} scrollContainerRef={scrollRef} />
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto overscroll-contain pb-safe-nav"
        style={{ paddingTop: SPRINT_HEADER_INSET }}
      >
        <TaskList tasks={tasks} />
        <div className="h-24" />
      </div>
    </div>
  )
}
