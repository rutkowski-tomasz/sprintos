import { motion } from 'motion/react'
import { FileText } from 'lucide-react'
import type { Task } from '@/types'

const STATUS_DOT: Record<number, string> = {
  0: 'bg-zinc-400',
  1: 'bg-purple-500',
  2: 'bg-blue-500',
  3: 'bg-emerald-500',
  4: 'bg-emerald-400/50',
}

const STATUS_BG: Record<number, string> = {
  0: '',
  1: 'bg-purple-500/[0.05]',
  2: 'bg-blue-500/[0.05]',
  3: 'bg-emerald-500/[0.05]',
  4: 'bg-emerald-500/[0.03]',
}

interface TaskRowProps {
  task: Task
}

export function TaskRow({ task }: TaskRowProps) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.18, ease: 'easeInOut' } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md overflow-hidden transition-colors ${STATUS_BG[task.status]}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${STATUS_DOT[task.status]}`} />
      {task.emoji && <span className="shrink-0 leading-none">{task.emoji}</span>}
      <span className="flex-1 text-sm leading-snug truncate">{task.name}</span>
      {task.description && (
        <FileText size={13} className="shrink-0 text-muted-foreground/40" />
      )}
    </motion.div>
  )
}
