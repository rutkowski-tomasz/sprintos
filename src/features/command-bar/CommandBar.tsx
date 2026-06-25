import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { parseTaskInput } from './taskInputParser'
import { sprintKey, sprintKeyOffset } from '@/features/properties/sprints/sprintEngine'
import { useSession } from '@/features/auth/useSession'
import { addTask, findSimilarTask } from '@/features/tasks/taskActions'
import type { Goal } from '@/types'

const ROUTE_PLACEHOLDER: Record<string, string> = {
  '/current': 'Add to current sprint...',
  '/next': 'Add to next sprint...',
  '/backlog': 'Add to backlog...',
}

const BASE_PLACEHOLDERS = ['Search tasks...', 'Add or search...', "What's next?"]

export interface CommandBarHandle {
  setValue: (text: string) => void
}

interface CommandBarProps {
  onFocusChange: (focused: boolean) => void
  onInputChange?: (value: string) => void
}

function sprintForPath(pathname: string): string | null {
  const now = new Date()
  if (pathname === '/current') return sprintKey(now)
  if (pathname === '/next') return sprintKeyOffset(now, 1)
  return null
}

export const CommandBar = forwardRef<CommandBarHandle, CommandBarProps>(function CommandBar(
  { onFocusChange, onInputChange },
  ref,
) {
  const location = useLocation()
  const { session } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  const placeholderIndexRef = useRef(0)
  const placeholderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [suggestedEmoji, setSuggestedEmoji] = useState<string | null>(null)

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
      inputRef.current?.focus()
    },
  }))

  const submit = useCallback(async (): Promise<boolean> => {
    if (!inputValue.trim() || !session) return false
    const parsed = parseTaskInput(inputValue, goals)
    if (!parsed.name) return false
    await addTask({
      userId: session.user.id,
      sprint: sprintForPath(location.pathname),
      goalId: parsed.goalId,
      name: parsed.name,
      emoji: parsed.emoji,
      status: parsed.status,
      eventDate: parsed.eventDate,
      snooze: parsed.snooze,
      sourceUrl: parsed.sourceUrl,
      duration: parsed.duration,
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

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value
    setInputValue(val)
    onInputChange?.(val)
    setPlaceholderVisible(!val)

    if (similarTimerRef.current) clearTimeout(similarTimerRef.current)
    const parsed = parseTaskInput(val, goals)
    if (val.trim() && !parsed.emoji) {
      similarTimerRef.current = setTimeout(async () => {
        const task = await findSimilarTask(val.trim())
        setSuggestedEmoji(task?.emoji ?? null)
      }, 400)
    } else {
      setSuggestedEmoji(null)
    }
  }, [onInputChange, setPlaceholderVisible, goals])

  const onClearMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setInputValue('')
    onInputChange?.('')
    setSuggestedEmoji(null)
    setPlaceholderVisible(true)
    inputRef.current?.focus()
  }, [onInputChange, setPlaceholderVisible])

  const handleSubmit = useCallback(async () => {
    const ok = await submit()
    if (ok) {
      setInputValue('')
      onInputChange?.('')
      setSuggestedEmoji(null)
      setPlaceholderVisible(true)
      startCycle()
      inputRef.current?.focus()
    }
  }, [submit, startCycle, onInputChange, setPlaceholderVisible])

  return (
    <div className="bn-search-bar">
      <div className="bn-search-area">
        <input
          ref={inputRef}
          type="text"
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
        <div ref={placeholderRef} className="bn-placeholder" aria-hidden="true" />
      </div>

      {suggestedEmoji && (
        <button
          type="button"
          className="mx-3 mb-2 self-start px-2.5 py-1 rounded-md border border-dashed border-white/30 bg-white/5 text-base leading-none hover:bg-white/10 transition-colors"
          onMouseDown={e => {
            e.preventDefault()
            const next = `${suggestedEmoji} ${inputValue}`
            setInputValue(next)
            onInputChange?.(next)
            setSuggestedEmoji(null)
            inputRef.current?.focus()
          }}
          aria-label={`Suggest emoji ${suggestedEmoji}`}
        >
          {suggestedEmoji}
        </button>
      )}

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
