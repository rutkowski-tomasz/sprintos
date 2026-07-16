import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { parse } from './taskInputParser'
import type { ParseResult } from './taskInputParser'
import { sprintKeyFromRouteParam } from '@/features/properties/sprint/sprintDef'
import { buildHighlightSegments } from './highlight'
import { useSession } from '@/features/auth/useSession'
import { addTask, findSimilarTasks } from '@/features/tasks/taskActions'
import { searchEmojis } from './emojiSearch'
import { EMPTY_SUGGESTIONS, suggestDurations, suggestEventDates, type SimilarTaskSuggestions } from './similarTaskSuggestions'
import { TaskStatus, type Goal } from '@/types'
import { matchCommands, routeForCommand, type CommandDef } from './commands'
import { CommandMenu } from './CommandMenu'

const SPRINT_PARAM_PLACEHOLDER: Record<string, string> = {
  current: 'Add to current sprint...',
  next: 'Add to next sprint...',
  previous: 'Add to previous sprint...',
}

function placeholderForPath(pathname: string): string | null {
  if (pathname === '/backlog') return 'Add to backlog...'
  const m = pathname.match(/^\/sprint\/(.+)$/)
  if (!m) return null
  return SPRINT_PARAM_PLACEHOLDER[m[1]] ?? 'Add to sprint...'
}

const BASE_PLACEHOLDERS = ['Search tasks...', 'Add or search...', "What's next?"]

export interface CommandBarHandle {
  setValue: (text: string) => void
  submit: () => Promise<void>
  focus: () => void
  close: () => void
}

interface CommandBarProps {
  onFocusChange: (focused: boolean) => void
  onInputChange?: (value: string) => void
  onParsedChange?: (parsed: ParseResult | null) => void
  onSuggestionsChange?: (suggestions: SimilarTaskSuggestions) => void
}

function sprintForPath(pathname: string): string | null {
  const m = pathname.match(/^\/sprint\/(.+)$/)
  if (!m) return null
  return sprintKeyFromRouteParam(m[1], new Date())
}

function findGoalForInput(input: string, goals: Goal[]): Goal | null {
  const m = /#(\S+)/i.exec(input)
  if (!m) return null
  const firstWord = m[1].toLowerCase()
  return goals.find(g => g.name.split(' ')[0].toLowerCase() === firstWord) ?? null
}

export const CommandBar = forwardRef<CommandBarHandle, CommandBarProps>(function CommandBar(
  { onFocusChange, onInputChange, onParsedChange, onSuggestionsChange },
  ref,
) {
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useSession()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  const placeholderIndexRef = useRef(0)
  const placeholderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)

  const isCommandMode = inputValue.startsWith('/')
  const commandMatches = useMemo(() => (isCommandMode ? matchCommands(inputValue) : []), [isCommandMode, inputValue])

  useEffect(() => { setSelectedCommandIndex(0) }, [inputValue])

  const goals = useLiveQuery(
    () => db.goals.filter(g => g.deletedAt === null).toArray(),
    [],
    [] as Goal[],
  )

  const setPlaceholderVisible = useCallback((visible: boolean) => {
    if (placeholderRef.current) placeholderRef.current.style.opacity = visible ? '' : '0'
  }, [])

  useImperativeHandle(ref, () => ({
    setValue: (text: string) => {
      setInputValue(text)
      onInputChange?.(text)
      setPlaceholderVisible(!text)
      if (similarTimerRef.current) clearTimeout(similarTimerRef.current)
      onSuggestionsChange?.(EMPTY_SUGGESTIONS)
      if (text) {
        const goal = findGoalForInput(text, goals)
        const p = parse(text, new Date(), goal?.id, goal?.name)
        setParsedResult(p)
        onParsedChange?.(p)
      } else {
        setParsedResult(null)
        onParsedChange?.(null)
      }
      const el = inputRef.current
      if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }
      el?.focus()
    },
    submit: handleSubmit,
    focus: () => inputRef.current?.focus(),
    close: () => {
      setInputValue('')
      onInputChange?.('')
      setParsedResult(null)
      onParsedChange?.(null)
      onSuggestionsChange?.(EMPTY_SUGGESTIONS)
      setPlaceholderVisible(true)
      startCycle()
      const el = inputRef.current
      if (el) { el.style.height = 'auto'; el.blur() }
    },
  }))

  const submit = useCallback(async (): Promise<boolean> => {
    if (!inputValue.trim() || !session) return false
    const goal = findGoalForInput(inputValue, goals)
    const parsed = parse(inputValue, new Date(), goal?.id, goal?.name)
    if (!parsed.title) return false
    await addTask({
      userId: session.user.id,
      sprint: parsed.sprintKey?.value ?? sprintForPath(location.pathname),
      goalId: parsed.goalId?.value ?? null,
      name: parsed.title,
      emoji: parsed.emoji?.value ?? null,
      status: (parsed.status?.value ?? TaskStatus.TODO) as TaskStatus,
      eventDate: parsed.eventDate?.value ?? null,
      snooze: null,
      sourceUrl: parsed.sourceUrl?.value ?? null,
      duration: parsed.duration?.value ?? null,
    })
    return true
  }, [inputValue, session, goals, location.pathname])

  const placeholders = useMemo(
    () => [...BASE_PLACEHOLDERS, placeholderForPath(location.pathname) ?? 'Add task...'],
    [location.pathname],
  )

  const showPlaceholder = useCallback((text: string, animate: boolean) => {
    const el = placeholderRef.current
    if (!el || el.style.opacity === '0') return
    if (animate && el.textContent) {
      el.classList.remove('ph-enter')
      el.classList.add('ph-exit')
      el.addEventListener('animationend', () => {
        const ph = placeholderRef.current
        if (!ph || ph.style.opacity === '0') return
        ph.textContent = text
        ph.classList.remove('ph-exit')
        ph.classList.add('ph-enter')
        ph.addEventListener('animationend', () => ph.classList.remove('ph-enter'), { once: true })
      }, { once: true })
    } else {
      el.textContent = text
    }
  }, [])

  const startCycle = useCallback(() => {
    showPlaceholder(placeholders[placeholderIndexRef.current], false)
    placeholderTimerRef.current = setInterval(() => {
      placeholderIndexRef.current = (placeholderIndexRef.current + 1) % placeholders.length
      showPlaceholder(placeholders[placeholderIndexRef.current], true)
    }, 3000)
  }, [showPlaceholder, placeholders])

  useEffect(() => {
    if (placeholderTimerRef.current) clearInterval(placeholderTimerRef.current)
    placeholderIndexRef.current = 0
    startCycle()
    return () => { if (placeholderTimerRef.current) clearInterval(placeholderTimerRef.current) }
  }, [startCycle])

  const onFocus = useCallback(() => {
    if (placeholderTimerRef.current) clearInterval(placeholderTimerRef.current)
    setPlaceholderVisible(!inputValue)
    onFocusChange(true)
  }, [setPlaceholderVisible, onFocusChange, inputValue])

  const onBlur = useCallback(() => {
    onFocusChange(false)
    if (!inputValue) {
      setPlaceholderVisible(true)
      startCycle()
    }
  }, [onFocusChange, inputValue, setPlaceholderVisible, startCycle])

  const executeCommand = useCallback((cmd: CommandDef) => {
    navigate(routeForCommand(cmd.key, new Date()))
    setInputValue('')
    onInputChange?.('')
    setParsedResult(null)
    onParsedChange?.(null)
    onSuggestionsChange?.(EMPTY_SUGGESTIONS)
    setPlaceholderVisible(true)
    startCycle()
    const el = inputRef.current
    if (el) { el.style.height = 'auto'; el.blur() }
  }, [navigate, onInputChange, onParsedChange, onSuggestionsChange, setPlaceholderVisible, startCycle])

  const similarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.currentTarget.value
    setInputValue(val)
    onInputChange?.(val)
    setPlaceholderVisible(!val)

    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`

    if (similarTimerRef.current) clearTimeout(similarTimerRef.current)

    if (val.startsWith('/')) {
      setParsedResult(null)
      onParsedChange?.(null)
      onSuggestionsChange?.(EMPTY_SUGGESTIONS)
      return
    }

    const goal = findGoalForInput(val, goals)
    const parsed = parse(val, new Date(), goal?.id, goal?.name)
    const next = val ? parsed : null
    setParsedResult(next)
    onParsedChange?.(next)

    if (val.trim() && !parsed.emoji) {
      similarTimerRef.current = setTimeout(async () => {
        const similar = await findSimilarTasks(val.trim(), 5)
        const top = similar[0] ?? null
        const taskEmoji = top?.emoji ?? null
        const libEmojis = searchEmojis(parsed.title ?? val.trim())
        const emojis = [...new Set([...(taskEmoji ? [taskEmoji] : []), ...libEmojis])]
        const durations = parsed.duration ? [] : suggestDurations(similar)
        const eventDates = parsed.eventDate ? [] : suggestEventDates(similar)
        onSuggestionsChange?.({ emojis, durations, eventDates })
      }, 400)
    } else {
      onSuggestionsChange?.(EMPTY_SUGGESTIONS)
    }
  }, [onInputChange, onParsedChange, onSuggestionsChange, setPlaceholderVisible, goals])

  const onClearMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setInputValue('')
    onInputChange?.('')
    onSuggestionsChange?.(EMPTY_SUGGESTIONS)
    setParsedResult(null)
    onParsedChange?.(null)
    setPlaceholderVisible(true)
    const el = inputRef.current
    if (el) { el.style.height = 'auto'; el.focus() }
  }, [onInputChange, onParsedChange, onSuggestionsChange, setPlaceholderVisible])

  const handleSubmit = useCallback(async () => {
    const ok = await submit()
    if (ok) {
      setInputValue('')
      onInputChange?.('')
      onSuggestionsChange?.(EMPTY_SUGGESTIONS)
      setParsedResult(null)
      onParsedChange?.(null)
      setPlaceholderVisible(true)
      startCycle()
      const el = inputRef.current
      if (el) { el.style.height = 'auto'; el.blur() }
    }
  }, [submit, startCycle, onInputChange, onParsedChange, onSuggestionsChange, setPlaceholderVisible])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      inputRef.current?.blur()
      return
    }
    if (isCommandMode) {
      if (e.key === 'ArrowDown' && commandMatches.length > 0) {
        e.preventDefault()
        setSelectedCommandIndex(i => (i + 1) % commandMatches.length)
      } else if (e.key === 'ArrowUp' && commandMatches.length > 0) {
        e.preventDefault()
        setSelectedCommandIndex(i => (i - 1 + commandMatches.length) % commandMatches.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const match = commandMatches[selectedCommandIndex]
        if (match) executeCommand(match)
      }
      return
    }
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
  }, [isCommandMode, commandMatches, selectedCommandIndex, executeCommand, handleSubmit])

  const highlightSegments = isCommandMode
    ? [{ text: inputValue, color: '#fff', underline: false }]
    : parsedResult ? buildHighlightSegments(inputValue, parsedResult) : null

  return (
    <>
      {isCommandMode && commandMatches.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 px-3.5 mb-1">
          <CommandMenu commands={commandMatches} selectedIndex={selectedCommandIndex} onSelect={executeCommand} />
        </div>
      )}
      <div className="bn-search-bar">
        <div className="bn-search-area">
          <textarea
            ref={inputRef}
            rows={1}
            className="bn-search-input"
            value={inputValue}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            inputMode="text"
            enterKeyHint="done"
            autoCapitalize="sentences"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search or add task"
          />
          {highlightSegments && (
            <div className="bn-highlight-overlay" aria-hidden="true">
              {highlightSegments.map((seg, i) => (
                <span
                  key={i}
                  style={{
                    color: seg.color,
                    textDecoration: seg.underline ? 'underline' : 'none',
                    textDecorationColor: seg.color,
                    textUnderlineOffset: '3px',
                  }}
                >
                  {seg.text}
                </span>
              ))}
            </div>
          )}
          <div ref={placeholderRef} className="bn-placeholder" aria-hidden="true" />
        </div>

        <button
          className={`bn-clear${inputValue ? ' bn-clear-visible' : ''}`}
          aria-label="Clear input"
          type="button"
          onMouseDown={onClearMouseDown}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18"/>
            <line x1="18" y1="6" x2="6" y2="18"/>
          </svg>
        </button>
      </div>
    </>
  )
})
