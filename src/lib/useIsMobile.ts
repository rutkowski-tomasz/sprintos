import { useSyncExternalStore } from 'react'

function makeIsMobileHook(query: string) {
  function subscribe(callback: () => void): () => void {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
  }

  function getSnapshot(): boolean {
    return window.matchMedia(query).matches
  }

  return function useMediaQuery(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot)
  }
}

export const useIsMobile = makeIsMobileHook('(max-width: 1023px)')
export const useIsSidebarMobile = makeIsMobileHook('(max-width: 767px)')
