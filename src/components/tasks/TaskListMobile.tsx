import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { SnoozeMenu } from '@/components/tasks/SnoozeMenu'
import { SwipeableTaskRow } from '@/components/tasks/SwipeableTaskRow'
import type { Goal, Task } from '@/types'

interface TaskListMobileProps {
  tasks: Task[]
}

export function TaskListMobile({ tasks }: TaskListMobileProps) {
  const [snoozeTarget, setSnoozeTarget] = useState<Task | null>(null)

  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )

  const goalMap = useMemo(() => new Map(goals.map(g => [g.id, g])), [goals])

  if (!tasks.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No tasks.</p>
  }

  return (
    <>
      <div className="border-t border-border">
        {tasks.map(task => (
          <SwipeableTaskRow
            key={task.id}
            task={task}
            goalMap={goalMap}
            onSnoozeRequest={setSnoozeTarget}
          />
        ))}
      </div>
      <SnoozeMenu task={snoozeTarget} onClose={() => setSnoozeTarget(null)} />
    </>
  )
}
