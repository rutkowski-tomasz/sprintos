import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { parse } from './taskInputParser'
import type { ParseResult } from './taskInputParser'
import { sprintKey, sprintKeyOffset } from '@/features/properties/sprint/sprintDef'
import { PROPERTY_COLORS } from '@/features/properties/registry'
import { useSession } from '@/features/auth/useSession'
import { addTask, findSimilarTask } from '@/features/tasks/taskActions'
import { searchEmojis } from './emojiSearch'
import { TaskStatus, type Goal } from '@/types'

const ROUTE_PLACEHOLDER: Record<string, string> = {
  '/current': 'Add to current sprint...',
  '/next': 'Add to next sprint...',
  '/backlog': 'Add to backlog...',
}

const BASE_PLACEHOLDERS = ['Search tasks...', 'Add or search...', "What's next?"]

const SPAN_COLORS: Record<string, string> = {
  date: PROPERTY_COLORS.eventDate,
  duration: PROPERTY_COLORS.duration,
  emoji: PROPERTY_COLORS.emoji,
  status: PROPERTY_COLORS.status,
  goal: PROPERTY_COLORS.goal,
  url: PROPERTY_COLORS.url,
}

export interface CommandBarHandle {
  setValue: (text: string) => void
  submit: () => Promise<void>
}

interface CommandBarProps {
  onFocusChange: (focused: boolean) => void
  onInputChange?: (value: string) => void
  onParsedChange?: (parsed: ParseResult | null) => void
  onSuggestionsChange?: (emojis: string[]) => void
}

function sprintForPath(pathname: string): string | null {
  const now = new Date()
  if (pathname === '/current') return sprintKey(now)
  if (pathname === '/next') return sprintKeyOffset(now, 1)
  return null
}

function findGoalForInput(input: string, goals: Goal[]): Goal | null {
  const m = /#(\S+)/i.exec(input)
  if (!m) return null
  const firstWord = m[1].toLowerCase()
  return goals.find(g => g.name.split(' ')[0].toLowerCase() === firstWord) ?? null
}

function buildHighlightSegments(input: string, parsed: ParseResult) {
  const spans = [
    parsed.emoji && { start: parsed.emoji.start, end: parsed.emoji.end, type: 'emoji' },
    parsed.eventDate && { start: parsed.eventDate.start, end: parsed.eventDate.end, type: 'date' },
    parsed.duration && { start: parsed.duration.start, end: parsed.duration.end, type: 'duration' },
    parsed.status && { start: parsed.status.start, end: parsed.status.end, type: 'status' },
    parsed.goalId && { start: parsed.goalId.start, end: parsed.goalId.end, type: 'goal' },
    parsed.sourceUrl && { start: parsed.sourceUrl.start, end: parsed.sourceUrl.end, type: 'url' },
  ].filter(Boolean) as Array<{ start: number; end: number; type: string }>

  spans.sort((a, b) => a.start - b.start)

  const segs: Array<{ text: string; color: string; underline: boolean }> = []
  let pos = 0
  for (const span of spans) {
    if (span.start > pos) segs.push({ text: input.slice(pos, span.start), color: '#fff', underline: false })
    segs.push({ text: input.slice(span.start, span.end), color: SPAN_COLORS[span.type], underline: true })
    pos = span.end
  }
  if (pos < input.length) segs.push({ text: input.slice(pos), color: '#fff', underline: false })
  return segs
}

export const CommandBar = forwardRef<CommandBarHandle, CommandBarProps>(function CommandBar(
  { onFocusChange, onInputChange, onParsedChange, onSuggestionsChange },
  ref,
) {
  const location = useLocation()
  const { session } = useSession()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  const placeholderIndexRef = useRef(0)
  const placeholderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null)

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
      onSuggestionsChange?.([])
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
  }))

  const submit = useCallback(async (): Promise<boolean> => {
    if (!inputValue.trim() || !session) return false
    const goal = findGoalForInput(inputValue, goals)
    const parsed = parse(inputValue, new Date(), goal?.id, goal?.name)
    if (!parsed.title) return false
    await addTask({
      userId: session.user.id,
      sprint: sprintForPath(location.pathname),
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
    () => [...BASE_PLACEHOLDERS, ROUTE_PLACEHOLDER[location.pathname] ?? 'Add task...'],
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
    setPlaceholderVisible(false)
    onFocusChange(true)
  }, [setPlaceholderVisible, onFocusChange])

  const onBlur = useCallback(() => {
    onFocusChange(false)
    if (!inputValue) {
      setPlaceholderVisible(true)
      startCycle()
    }
  }, [onFocusChange, inputValue, setPlaceholderVisible, startCycle])

  const similarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.currentTarget.value
    setInputValue(val)
    onInputChange?.(val)
    setPlaceholderVisible(!val)

    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`

    const goal = findGoalForInput(val, goals)
    const parsed = parse(val, new Date(), goal?.id, goal?.name)
    const next = val ? parsed : null
    setParsedResult(next)
    onParsedChange?.(next)

    if (similarTimerRef.current) clearTimeout(similarTimerRef.current)
    if (val.trim() && !parsed.emoji) {
      similarTimerRef.current = setTimeout(async () => {
        const task = await findSimilarTask(val.trim())
        const taskEmoji = task?.emoji ?? null
        const libEmojis = searchEmojis(parsed.title ?? val.trim())
        const combined = [...new Set([...(taskEmoji ? [taskEmoji] : []), ...libEmojis])]
        onSuggestionsChange?.(combined)
      }, 400)
    } else {
      onSuggestionsChange?.([])
    }
  }, [onInputChange, onSuggestionsChange, setPlaceholderVisible, goals])

  const onClearMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setInputValue('')
    onInputChange?.('')
    onSuggestionsChange?.([])
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
      onSuggestionsChange?.([])
      setParsedResult(null)
      onParsedChange?.(null)
      setPlaceholderVisible(true)
      startCycle()
      const el = inputRef.current
      if (el) { el.style.height = 'auto'; el.focus() }
    }
  }, [submit, startCycle, onInputChange, onParsedChange, onSuggestionsChange, setPlaceholderVisible])

  const highlightSegments = parsedResult ? buildHighlightSegments(inputValue, parsedResult) : null

  return (
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
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
          inputMode="text"
          enterKeyHint="done"
          autoCapitalize="none"
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
  )
})
