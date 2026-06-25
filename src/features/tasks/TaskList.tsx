import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { TaskRow } from './TaskRow'
import type { Goal, Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
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
    <div className="border-t border-border">
      {tasks.map(task => (
        <TaskRow key={task.id} task={task} goalMap={goalMap} />
      ))}
    </div>
  )
}
