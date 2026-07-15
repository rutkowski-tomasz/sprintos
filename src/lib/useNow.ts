import { useEffect, useState } from 'react'

const REFRESH_MS = 30_000

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), REFRESH_MS)
    return () => clearInterval(id)
  }, [])
  return now
}
