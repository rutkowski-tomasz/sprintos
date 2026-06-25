import { ViewHeader } from '@/features/navigation/ViewHeader'

export function Backlog() {
  return (
    <div className="h-full flex flex-col overflow-auto pb-safe-nav">
      <ViewHeader viewName="Backlog" />
    </div>
  )
}
