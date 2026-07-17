import { ViewHeader } from '@/features/navigation/ViewHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function Goals() {
  useDocumentTitle('Goals')
  return (
    <div className="h-full flex flex-col overflow-auto pb-safe-nav">
      <ViewHeader viewName="Goals" />
    </div>
  )
}
