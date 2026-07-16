import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 1023px)'

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
