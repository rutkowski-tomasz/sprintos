import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { db } from '@/lib/db'
import type { Goal } from '@/types'
import { Suggestion } from './Suggestion'
import { TaskPreview } from './TaskPreview'

interface CommandResultsProps {
  inputValue: string
  onCopy: (text: string) => void
}

export function CommandResults({ inputValue, onCopy }: CommandResultsProps) {
  const tasks = useLiveQuery(async () => {
    const all = await db.tasks.filter(t => t.deletedAt === null).toArray()
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const q = inputValue.trim().toLowerCase()
    if (!q) return all.slice(0, 5)
    return all.filter(t => t.name.toLowerCase().includes(q)).slice(0, 5)
  }, [inputValue])

  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )

  const showPreview = inputValue.trim().length > 0

  if (!tasks?.length && !showPreview) return null

  return (
    <motion.div
      className="bn-suggestions rounded-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
    >
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
        Results
      </p>
      {tasks?.map(task => (
        <Suggestion key={task.id} task={task} onCopy={onCopy} />
      ))}
      {showPreview && (
        <>
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
            Task Preview
          </p>
          <TaskPreview inputValue={inputValue} goals={goals ?? []} />
        </>
      )}
    </motion.div>
  )
}
