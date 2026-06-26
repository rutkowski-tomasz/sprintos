import { useEffect, useRef, useState } from 'react'
import { NavMenu } from './NavMenu'
import { CommandBar, type CommandBarHandle } from '@/features/command-bar/CommandBar'
import { CommandResults } from '@/features/command-bar/CommandResults'
import type { ParseResult } from '@/features/command-bar/taskInputParser'
import type { SuggestionItem } from '@/features/command-bar/CommandSuggestion'
import './BottomBar.css'

export function BottomBar() {
  const [searchFocused, setSearchFocused] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null)
  const [suggestedEmoji, setSuggestedEmoji] = useState<string | null>(null)
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

  const suggestions: SuggestionItem[] = suggestedEmoji
    ? [{ label: suggestedEmoji, onApply: () => commandBarRef.current?.setValue(`${suggestedEmoji} ${inputValue}`) }]
    : []

  return (
    <div ref={rootRef} className={`bn-root${searchFocused ? ' bn-search-focused' : ''}`}>
      {searchFocused && (
        <div className="absolute bottom-full left-0 right-0 px-3.5 mb-1">
          <CommandResults
            inputValue={inputValue}
            parsed={parsedResult}
            suggestions={suggestions}
            onCopy={text => commandBarRef.current?.setValue(text)}
            onSubmit={() => commandBarRef.current?.submit()}
          />
        </div>
      )}
      <NavMenu />
      <CommandBar
        ref={commandBarRef}
        onFocusChange={setSearchFocused}
        onInputChange={setInputValue}
        onParsedChange={setParsedResult}
        onSuggestionsChange={setSuggestedEmoji}
      />
    </div>
  )
}
