import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  classifySprintKey,
  compareSprintKeys,
  formatSprintKey,
  generateSprintKeys,
  sprintDateRange,
  sprintKeyOffset,
} from './sprintDef'
import { updateTask } from '@/features/tasks/taskActions'
import type { Task } from '@/types'

const BADGE_CLASS: Record<string, string> = {
  current:  'bg-blue-500/15 text-blue-400 border-transparent',
  next:     'bg-purple-500/15 text-purple-400 border-transparent',
  future:   'bg-zinc-500/15 text-zinc-400 border-transparent',
  previous: 'bg-amber-500/15 text-amber-400 border-transparent',
  past:     'bg-zinc-400/10 text-zinc-500 border-transparent',
}

const BADGE_TEXT: Record<string, string> = {
  current:  'Current',
  next:     'Next',
  future:   'Future',
  previous: 'Previous',
  past:     'Past',
}

type SprintOption =
  | { type: 'none' }
  | { type: 'sprint'; key: string; display: string; badge: string; dateRange: string }

function fmtDate(d: Date, now: Date): string {
  const day = d.getDate()
  const month = d.toLocaleString('en', { month: 'short' })
  const yr = d.getFullYear() !== now.getFullYear() ? ` '${String(d.getFullYear()).slice(-2)}` : ''
  return `${month} ${day}${yr}`
}

function toOption(key: string, now: Date): SprintOption & { type: 'sprint' } {
  const badge = classifySprintKey(key, now)
  const { start, end } = sprintDateRange(key)
  return {
    type: 'sprint',
    key,
    display: formatSprintKey(key, now),
    badge,
    dateRange: `${fmtDate(start, now)} – ${fmtDate(end, now)}`,
  }
}

function buildOptions(
  assigned: string | null,
  search: string,
  now: Date,
  allKeys: string[],
): SprintOption[] {
  const none: SprintOption = { type: 'none' }

  if (!search.trim()) {
    const windowKeys = new Set<string>()
    for (let i = 0; i <= 4; i++) windowKeys.add(sprintKeyOffset(now, i))
    if (assigned) windowKeys.delete(assigned)
    const sorted = Array.from(windowKeys).sort((a, b) => compareSprintKeys(a, b))
    const sprintKeys = assigned ? [assigned, ...sorted] : sorted
    return [none, ...sprintKeys.map(k => toOption(k, now))]
  }

  const LABEL_PRIORITY: Record<string, number> = {
    current: 0, next: 1, future: 2, previous: 3, past: 4,
  }

  const q = search.toLowerCase()
  const filtered = allKeys.filter(
    k => k.toLowerCase().includes(q) || formatSprintKey(k, now).toLowerCase().includes(q),
  )
  const sorted = [...filtered].sort((a, b) => {
    const pa = LABEL_PRIORITY[classifySprintKey(a, now)]
    const pb = LABEL_PRIORITY[classifySprintKey(b, now)]
    if (pa !== pb) return pa - pb
    return classifySprintKey(a, now) === 'past'
      ? compareSprintKeys(b, a)
      : compareSprintKeys(a, b)
  })
  return [none, ...sorted.slice(0, 20).map(k => toOption(k, now))]
}

const DROPDOWN_H = 340

export function SprintPicker({ task }: { task: Task }) {
  const now = useMemo(() => new Date(), [])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, minWidth: 280 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const hlRef = useRef(0)
  hlRef.current = highlighted

  const allKeys = useMemo(() => generateSprintKeys(now, 1, 1), [now])
  const options = useMemo(
    () => buildOptions(task.sprint, search, now, allKeys),
    [task.sprint, search, now, allKeys],
  )

  useEffect(() => { setHighlighted(0) }, [search])

  useEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const top = window.innerHeight - rect.bottom >= DROPDOWN_H
      ? rect.bottom + 4
      : rect.top - DROPDOWN_H - 4
    const minWidth = Math.max(rect.width, 300)
    const left = rect.left + minWidth > window.innerWidth
      ? Math.max(0, rect.right - minWidth)
      : rect.left
    setDropPos({ top, left, minWidth })
    const idx = task.sprint
      ? options.findIndex(o => o.type === 'sprint' && o.key === task.sprint)
      : 0
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
        const opt = options[hlRef.current]
        if (opt) pick(opt.type === 'none' ? null : opt.key)
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

  function pick(key: string | null) {
    void updateTask(task.id, { sprint: key })
    close()
  }

  const label = task.sprint ? `Sprint ${formatSprintKey(task.sprint, now)}` : null

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
      >
        {label ?? <span className="text-muted-foreground/30">—</span>}
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
              placeholder="Search sprints…"
              className="h-7 text-sm"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt, idx) => {
              const isCurrent = opt.type === 'none'
                ? task.sprint === null
                : task.sprint === opt.key
              return (
                <div
                  key={opt.type === 'none' ? '__none__' : opt.key}
                  ref={el => { itemRefs.current[idx] = el }}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${highlighted === idx ? 'bg-accent' : 'hover:bg-accent/50'}`}
                  onMouseEnter={() => setHighlighted(idx)}
                  onClick={() => pick(opt.type === 'none' ? null : opt.key)}
                >
                  <div className="w-3 shrink-0">
                    {isCurrent && <Check size={12} />}
                  </div>
                  {opt.type === 'none' ? (
                    <span className="text-sm text-muted-foreground">Backlog</span>
                  ) : (
                    <>
                      <span className="text-sm font-medium w-16 shrink-0">{opt.display}</span>
                      <Badge className={`${BADGE_CLASS[opt.badge]} text-[10px] shrink-0`}>
                        {BADGE_TEXT[opt.badge]}
                      </Badge>
                      <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap pl-3">
                        {opt.dateRange}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
