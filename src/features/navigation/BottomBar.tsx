import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { NavMenu } from './NavMenu'
import { CommandBar, type CommandBarHandle } from '@/features/command-bar/CommandBar'
import { TaskPreviewCard } from '@/features/command-bar/TaskPreviewCard'
import type { ParseResult } from '@/features/command-bar/taskInputParser'
import type { SuggestionItem } from '@/features/command-bar/CommandSuggestion'
import { EMPTY_SUGGESTIONS, formatDurationToken, type SimilarTaskSuggestions } from '@/features/command-bar/similarTaskSuggestions'
import { formatDuration } from '@/features/properties/duration/durationDef'
import './BottomBar.css'

interface BottomBarProps {
  searchFocused: boolean
  onFocusChange: (focused: boolean) => void
  inputValue: string
  onInputChange: (value: string) => void
  commandBarRef: RefObject<CommandBarHandle | null>
}

export function BottomBar({ searchFocused, onFocusChange, inputValue, onInputChange, commandBarRef }: BottomBarProps) {
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null)
  const [similarSuggestions, setSimilarSuggestions] = useState<SimilarTaskSuggestions>(EMPTY_SUGGESTIONS)
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
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  const appendToken = (token: string) => commandBarRef.current?.setValue(`${inputValue.trimEnd()} ${token}`)

  const suggestions: SuggestionItem[] = [
    ...similarSuggestions.emojis.map(emoji => ({
      label: emoji,
      onApply: () => commandBarRef.current?.setValue(`${emoji} ${inputValue}`),
    })),
    ...similarSuggestions.durations.map(seconds => ({
      label: formatDuration(seconds),
      onApply: () => appendToken(formatDurationToken(seconds)),
    })),
    ...similarSuggestions.eventDates.map(eventDate => ({
      label: eventDate.label,
      onApply: () => appendToken(eventDate.tokenText),
    })),
  ]

  return (
    <div ref={rootRef} className={`bn-root${searchFocused ? ' bn-search-focused' : ''}`}>
      {searchFocused && parsedResult && (
        <div className="absolute bottom-full left-0 right-0 px-3.5 mb-1">
          <TaskPreviewCard
            parsed={parsedResult}
            suggestions={suggestions}
            onSubmit={() => commandBarRef.current?.submit()}
          />
        </div>
      )}
      <NavMenu />
      <CommandBar
        ref={commandBarRef}
        onFocusChange={onFocusChange}
        onInputChange={onInputChange}
        onParsedChange={setParsedResult}
        onSuggestionsChange={setSimilarSuggestions}
      />
    </div>
  )
}
