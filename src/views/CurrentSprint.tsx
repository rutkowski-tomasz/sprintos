import { useState } from 'react'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskStatus, type Task } from '@/types'

const MOCK: Task[] = [
  {
    id: '1', userId: 'mock', sprintId: null, goalId: null,
    name: 'Review pull requests', emoji: '👀', status: TaskStatus.IN_PROGRESS,
    description: 'Check queue and leave comments', sourceUrl: null,
    eventDate: null, snooze: null, duration: null,
    version: 1, createdAt: '', updatedAt: '', deletedAt: null,
  },
  {
    id: '2', userId: 'mock', sprintId: null, goalId: null,
    name: 'Write weekly update', emoji: '📝', status: TaskStatus.IN_PROGRESS,
    description: null, sourceUrl: null,
    eventDate: null, snooze: null, duration: null,
    version: 1, createdAt: '', updatedAt: '', deletedAt: null,
  },
  {
    id: '3', userId: 'mock', sprintId: null, goalId: null,
    name: 'Refactor sync engine', emoji: '⚙️', status: TaskStatus.NEXT,
    description: 'Move queue collapsing logic into its own module', sourceUrl: null,
    eventDate: null, snooze: null, duration: null,
    version: 1, createdAt: '', updatedAt: '', deletedAt: null,
  },
  {
    id: '4', userId: 'mock', sprintId: null, goalId: null,
    name: 'Update dependencies', emoji: null, status: TaskStatus.TODO,
    description: null, sourceUrl: null,
    eventDate: null, snooze: null, duration: null,
    version: 1, createdAt: '', updatedAt: '', deletedAt: null,
  },
]

export function CurrentSprint() {
  const [tasks, setTasks] = useState(MOCK)

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Current Sprint</h2>
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setTasks(prev => prev.length ? [] : MOCK)}
        >
          {tasks.length ? 'Clear' : 'Restore'}
        </button>
      </div>
      <TaskList tasks={tasks} />
    </div>
  )
}
