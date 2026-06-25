import { useEffect, useRef, useState } from 'react'
import { NavMenu } from './NavMenu'
import { CommandBar } from '@/features/command-bar/CommandBar'
import './BottomBar.css'

export function BottomBar() {
  const [searchFocused, setSearchFocused] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const el = rootRef.current
    if (!el) return
    const update = () => {
      const inset = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height))
      el.style.transform = inset > 0 ? `translateY(-${inset}px)` : ''
    }
    vv.addEventListener('resize', update)
    return () => vv.removeEventListener('resize', update)
  }, [])

  return (
    <div ref={rootRef} className={`bn-root${searchFocused ? ' bn-search-focused' : ''}`}>
      <NavMenu />
      <CommandBar onFocusChange={setSearchFocused} />
    </div>
  )
}
