import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { Input } from './input'

interface SearchableDropdownProps<T> {
  triggerRef: RefObject<HTMLElement | null>
  options: T[]
  getKey: (option: T, index: number) => string
  isSelected: (option: T) => boolean
  renderOption: (option: T) => ReactNode
  onPick: (option: T) => void
  onClose: () => void
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  height: number
  minWidth: number
}

// A search-filtered listbox rendered in a portal below (or above) its trigger,
// with keyboard navigation, outside-click dismissal and highlight scrolling.
// Mounted only while open, so its mount is the open transition.
export function SearchableDropdown<T>({
  triggerRef,
  options,
  getKey,
  isSelected,
  renderOption,
  onPick,
  onClose,
  search,
  onSearchChange,
  searchPlaceholder,
  height,
  minWidth,
}: SearchableDropdownProps<T>) {
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth })
  const [highlighted, setHighlighted] = useState(0)

  // Latest values for listeners that subscribe once, to avoid stale closures.
  const highlightedRef = useRef(0)
  const onPickRef = useRef(onPick)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    highlightedRef.current = highlighted
    onPickRef.current = onPick
    onCloseRef.current = onClose
  })

  useEffect(() => { setHighlighted(0) }, [search])

  useEffect(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const top = window.innerHeight - rect.bottom >= height ? rect.bottom + 4 : rect.top - height - 4
    const width = Math.max(rect.width, minWidth)
    const left = rect.left + width > window.innerWidth ? Math.max(0, rect.right - width) : rect.left
    setPos({ top, left, minWidth: width })
    const selected = options.findIndex(isSelected)
    setHighlighted(selected >= 0 ? selected : 0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    itemRefs.current[highlighted]?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropRef.current?.contains(t)) onCloseRef.current()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [triggerRef])

  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    function onKey(e: KeyboardEvent) {
      e.stopPropagation()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlighted(h => Math.min(h + 1, options.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlighted(h => Math.max(h - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const option = options[highlightedRef.current]
        if (option !== undefined) onPickRef.current(option)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [options])

  return createPortal(
    <div
      ref={dropRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.minWidth, zIndex: 50 }}
      className="bg-popover border border-border rounded-md shadow-lg overflow-hidden flex flex-col"
    >
      <div className="p-2 border-b border-border">
        <Input
          ref={inputRef}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-7 text-sm"
        />
      </div>
      <div className="max-h-60 overflow-y-auto py-1">
        {options.map((option, idx) => (
          <div
            key={getKey(option, idx)}
            ref={el => { itemRefs.current[idx] = el }}
            className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${highlighted === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
            onMouseEnter={() => setHighlighted(idx)}
            onClick={() => onPick(option)}
          >
            <div className="w-3 shrink-0">{isSelected(option) && <Check size={12} />}</div>
            {renderOption(option)}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}
