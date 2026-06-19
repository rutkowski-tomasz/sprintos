import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AuthPage } from '@/components/AuthPage'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/useSession'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { addTask } from '@/lib/sync'

export default function App() {
  const { session, loading } = useSession()
  const tasks = useLiveQuery(() => db.test_tasks.orderBy('created_at').reverse().toArray(), [])
  const queueCount = useLiveQuery(() => db.sync_queue.count(), [])
  const [title, setTitle] = useState('')

  if (loading) return null
  if (!session) return <AuthPage />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await addTask(title.trim())
    setTitle('')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">SprintOS</h1>
        <div className="flex items-center gap-3">
          {!!queueCount && (
            <span className="text-xs text-muted-foreground">{queueCount} pending</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-lg border border-border bg-input/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={!title.trim()}>Add</Button>
      </form>

      <ul className="space-y-2">
        {tasks?.map(task => (
          <li key={task.id} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
            {task.title}
            <span className="ml-2 text-xs text-muted-foreground">
              {new Date(task.created_at).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
