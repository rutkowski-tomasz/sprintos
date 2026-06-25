import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTaskCreator } from './useTaskCreator'

const ROUTE_PLACEHOLDER: Record<string, string> = {
  '/current': 'Add to current sprint...',
  '/next': 'Add to next sprint...',
  '/backlog': 'Add to backlog...',
}

const BASE_PLACEHOLDERS = ['Search tasks...', 'Add or search...', "What's next?"]

interface CommandBarProps {
  onFocusChange: (focused: boolean) => void
}

export function CommandBar({ onFocusChange }: CommandBarProps) {
  const location = useLocation()
  const inputRef = useRef<HTMLDivElement>(null)
  const phRef = useRef<HTMLDivElement>(null)
  const phIdxRef = useRef(0)
  const phTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phVisibleRef = useRef(true)
  const [inputValue, setInputValue] = useState('')

  const { submit } = useTaskCreator(inputValue)

  const placeholders = useMemo(
    () => [...BASE_PLACEHOLDERS, ROUTE_PLACEHOLDER[location.pathname] ?? 'Add task...'],
    [location.pathname],
  )

  const showPlaceholder = useCallback((text: string, animate: boolean) => {
    const el = phRef.current
    if (!el || !phVisibleRef.current) return
    if (animate && el.textContent) {
      el.classList.remove('ph-enter')
      el.classList.add('ph-exit')
      el.addEventListener('animationend', () => {
        el.textContent = text
        el.classList.remove('ph-exit')
        el.classList.add('ph-enter')
        el.addEventListener('animationend', () => el.classList.remove('ph-enter'), { once: true })
      }, { once: true })
    } else {
      el.textContent = text
    }
  }, [])

  const startCycle = useCallback(() => {
    showPlaceholder(placeholders[phIdxRef.current], false)
    phTimerRef.current = setInterval(() => {
      phIdxRef.current = (phIdxRef.current + 1) % placeholders.length
      showPlaceholder(placeholders[phIdxRef.current], true)
    }, 3000)
  }, [showPlaceholder, placeholders])

  useEffect(() => {
    if (phTimerRef.current) clearInterval(phTimerRef.current)
    phIdxRef.current = 0
    startCycle()
    return () => { if (phTimerRef.current) clearInterval(phTimerRef.current) }
  }, [startCycle])

  const onFocus = () => {
    if (phTimerRef.current) clearInterval(phTimerRef.current)
    phVisibleRef.current = false
    if (phRef.current) phRef.current.style.opacity = '0'
    onFocusChange(true)
  }

  const onBlur = () => {
    onFocusChange(false)
    if (!inputValue) {
      phVisibleRef.current = true
      if (phRef.current) phRef.current.style.opacity = ''
      startCycle()
    }
  }

  const onInput = (e: React.FormEvent<HTMLDivElement>) => {
    const val = (e.currentTarget as HTMLDivElement).textContent ?? ''
    setInputValue(val)
    if (phRef.current) phRef.current.style.opacity = val ? '0' : ''
  }

  const onClearMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setInputValue('')
    if (inputRef.current) inputRef.current.textContent = ''
    if (phRef.current) phRef.current.style.opacity = ''
  }

  const handleSubmit = useCallback(async () => {
    const ok = await submit()
    if (ok) {
      setInputValue('')
      if (inputRef.current) inputRef.current.textContent = ''
      if (phRef.current) phRef.current.style.opacity = ''
      phVisibleRef.current = true
      startCycle()
      inputRef.current?.focus()
    }
  }, [submit, startCycle])

  return (
    <div className="bn-search-bar">
      <div className="bn-search-area">
        <div
          ref={inputRef}
          className="bn-search-input"
          contentEditable
          inputMode="search"
          autoCapitalize="sentences"
          spellCheck={false}
          aria-label="Search or add task"
          role="textbox"
          aria-multiline="false"
          suppressContentEditableWarning
          onFocus={onFocus}
          onBlur={onBlur}
          onInput={onInput}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
        />
        <div ref={phRef} className="bn-placeholder" aria-hidden="true" />
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

      <button className="bn-submit" aria-label="Submit" type="button" onClick={handleSubmit}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"/>
          <polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>
    </div>
  )
}
