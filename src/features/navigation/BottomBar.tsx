import { useEffect, useRef, useState } from 'react'
import { NavMenu } from './NavMenu'
import { CommandBar, type CommandBarHandle } from '@/features/command-bar/CommandBar'
import { Suggestions } from '@/features/command-bar/Suggestions'
import './BottomBar.css'

export function BottomBar() {
  const [searchFocused, setSearchFocused] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const commandBarRef = useRef<CommandBarHandle>(null)
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
      {searchFocused && (
        <div className="absolute bottom-full left-0 right-0 px-3.5 mb-2">
          <Suggestions
            inputValue={inputValue}
            onCopy={text => commandBarRef.current?.setValue(text)}
          />
        </div>
      )}
      <NavMenu />
      <CommandBar
        ref={commandBarRef}
        onFocusChange={setSearchFocused}
        onInputChange={setInputValue}
      />
    </div>
  )
}
