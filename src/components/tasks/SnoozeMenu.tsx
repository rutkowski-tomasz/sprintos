import { AnimatePresence, motion } from 'motion/react'
import { updateTask } from '@/lib/taskActions'
import type { Task } from '@/types'

type SnoozeOption = 'hour' | 'tomorrow' | 'week'

function computeSnoozeDate(option: SnoozeOption): string {
  const now = new Date()
  if (option === 'hour') {
    return new Date(now.getTime() + 3600 * 1000).toISOString()
  }
  const d = new Date(now)
  if (option === 'tomorrow') {
    d.setDate(d.getDate() + 1)
  } else {
    const day = d.getDay()
    d.setDate(d.getDate() + ((8 - day) % 7 || 7))
  }
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

const OPTIONS: { key: SnoozeOption; label: string; sublabel: string }[] = [
  { key: 'hour', label: '1 hour', sublabel: 'from now' },
  { key: 'tomorrow', label: 'Tomorrow', sublabel: '9:00 AM' },
  { key: 'week', label: 'Next week', sublabel: 'Mon 9:00 AM' },
]

interface SnoozeMenuProps {
  task: Task | null
  onClose: () => void
}

export function SnoozeMenu({ task, onClose }: SnoozeMenuProps) {
  async function apply(option: SnoozeOption) {
    if (!task) return
    await updateTask(task.id, { snooze: computeSnoozeDate(option) })
    onClose()
  }

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 bg-background rounded-t-2xl px-4 pt-4 pb-safe-nav"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            <div className="mb-1 px-1">
              <p className="text-xs text-muted-foreground truncate">{task.emoji ? `${task.emoji} ` : ''}{task.name}</p>
              <h3 className="font-semibold mt-0.5">Snooze until…</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 py-4">
              {OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => void apply(opt.key)}
                  className="flex flex-col items-center gap-1 py-4 rounded-xl bg-muted active:bg-muted/60 transition-colors"
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.sublabel}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
