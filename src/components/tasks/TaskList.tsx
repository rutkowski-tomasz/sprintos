import { AnimatePresence } from 'motion/react'
import { TaskRow } from './TaskRow'
import type { Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </AnimatePresence>
    </div>
  )
}
