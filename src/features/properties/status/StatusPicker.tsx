import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { updateTask } from '@/features/tasks/taskActions'
import { TaskStatus, type Task } from '@/types'
import { STATUS_LABEL, STATUS_BADGE, ALL_STATUSES } from './statusDef'

const DROPDOWN_H = 280

export function StatusPicker({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, minWidth: 220 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const hlRef = useRef(0)
  hlRef.current = highlighted

  const options = useMemo(
    () => search.trim()
      ? ALL_STATUSES.filter(s => STATUS_LABEL[s].toLowerCase().includes(search.toLowerCase()))
      : [...ALL_STATUSES],
    [search],
  )

  useEffect(() => { setHighlighted(0) }, [search])

  useEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const top = window.innerHeight - rect.bottom >= DROPDOWN_H
      ? rect.bottom + 4
      : rect.top - DROPDOWN_H - 4
    const minWidth = Math.max(rect.width, 220)
    const left = rect.left + minWidth > window.innerWidth
      ? Math.max(0, rect.right - minWidth)
      : rect.left
    setDropPos({ top, left, minWidth })
    const idx = options.indexOf(task.status as typeof ALL_STATUSES[number])
    setHighlighted(idx >= 0 ? idx : 0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    itemRefs.current[highlighted]?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropRef.current?.contains(t)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open) return
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
        const status = options[hlRef.current]
        if (status !== undefined) pick(status)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [open, options]) // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    setOpen(false)
    setSearch('')
    setHighlighted(0)
  }

  function pick(status: TaskStatus) {
    void updateTask(task.id, { status })
    close()
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        className="inline-flex"
      >
        <Badge className={STATUS_BADGE[task.status]}>{STATUS_LABEL[task.status]}</Badge>
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, minWidth: dropPos.minWidth, zIndex: 50 }}
          className="bg-popover border border-border rounded-md shadow-lg overflow-hidden flex flex-col"
        >
          <div className="p-2 border-b border-border">
            <Input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search status…"
              className="h-7 text-sm"
            />
          </div>
          <div className="py-1">
            {options.map((status, idx) => (
              <div
                key={status}
                ref={el => { itemRefs.current[idx] = el }}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${highlighted === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
                onMouseEnter={() => setHighlighted(idx)}
                onClick={() => pick(status)}
              >
                <div className="w-3 shrink-0">
                  {task.status === status && <Check size={12} />}
                </div>
                <Badge className={`${STATUS_BADGE[status]} text-[10px] shrink-0`}>
                  {STATUS_LABEL[status]}
                </Badge>
                <span className="ml-auto inline-flex items-center gap-0.5 shrink-0">
                  <kbd className="inline-flex items-center justify-center rounded border border-border/60 bg-muted px-1 py-px text-[10px] font-mono text-muted-foreground leading-none">⌘</kbd>
                  <kbd className="inline-flex items-center justify-center rounded border border-border/60 bg-muted px-1 py-px text-[10px] font-mono text-muted-foreground leading-none">{status + 1}</kbd>
                </span>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
