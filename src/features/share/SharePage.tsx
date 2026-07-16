import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/features/auth/useSession'
import { addTask } from '@/features/tasks/taskActions'
import { sprintKey } from '@/features/properties/sprint/sprintDef'
import { fetchYouTubeTitle, isYouTubeUrl } from '@/lib/oembed'
import { TaskStatus } from '@/types'

const URL_RE = /https?:\/\/\S+/

function extractUrl(url: string | null, text: string | null): string | null {
  if (url) return url
  const found = text?.match(URL_RE)?.[0] ?? null
  return found
}

function extractName(title: string | null, text: string | null, url: string | null): string {
  const cleanText = text?.replace(URL_RE, '').trim() || null
  return title?.trim() || cleanText || url || 'Shared task'
}

export function SharePage() {
  const { session, loading } = useSession()
  const navigate = useNavigate()
  const ranRef = useRef(false)
  const [status, setStatus] = useState('Adding task...')

  useEffect(() => {
    if (loading || !session || ranRef.current) return
    ranRef.current = true

    const params = new URLSearchParams(window.location.search)
    const title = params.get('title')
    const text = params.get('text')
    const url = extractUrl(params.get('url'), text)

    async function run() {
      let name = extractName(title, text, url)
      if (url && isYouTubeUrl(url) && !title) {
        const ytTitle = await fetchYouTubeTitle(url)
        if (ytTitle) name = ytTitle
      }

      const sprint = sprintKey(new Date())
      const id = await addTask({
        userId: session!.user.id,
        sprint,
        goalId: null,
        name,
        emoji: null,
        status: TaskStatus.TODO,
        eventDate: null,
        snooze: null,
        sourceUrl: url,
        duration: null,
      })

      navigate(`/sprint/current/${id}`, { replace: true })
    }

    run().catch(() => setStatus('Could not add task.'))
  }, [loading, session, navigate])

  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  )
}
