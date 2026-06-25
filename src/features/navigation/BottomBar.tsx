import { useState } from 'react'
import { NavMenu } from './NavMenu'
import { CommandBar } from '@/features/command-bar/CommandBar'
import './BottomBar.css'

export function BottomBar() {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <div className={`bn-root${searchFocused ? ' bn-search-focused' : ''}`}>
      <NavMenu />
      <CommandBar onFocusChange={setSearchFocused} />
    </div>
  )
}
