import { useEffect, useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { addGizmo, setupSync } from './sync'

export default function App() {
  const [online, setOnline] = useState(navigator.onLine)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cleanup = setupSync()
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      cleanup()
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const gizmos = useLiveQuery(() =>
    db.gizmos.orderBy('created_at').reverse().toArray()
  )
  const queueCount = useLiveQuery(() => db.sync_queue.count())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input = inputRef.current!
    const title = input.value.trim()
    if (!title) return
    input.value = ''
    await addGizmo(title)
  }

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <h1>SprintOS POC</h1>

      <p>
        Status: <strong>{online ? '🟢 online' : '🔴 offline'}</strong>
        {(queueCount ?? 0) > 0 && <span> — {queueCount} pending in queue</span>}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          ref={inputRef}
          placeholder="New gizmo title..."
          style={{ flex: 1, padding: '6px 10px', fontSize: 14 }}
        />
        <button type="submit">Add</button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {gizmos?.map((g) => (
          <li key={g.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>{g.title}</span>
            <span style={{ color: '#999', fontSize: 12, marginLeft: 12 }}>
              {new Date(g.created_at).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
