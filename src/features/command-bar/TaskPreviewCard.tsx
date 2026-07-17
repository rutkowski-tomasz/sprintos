import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { TaskStatus } from '@/types'
import { TaskResultRow } from './TaskResultRow'
import type { ParseResult } from './taskInputParser'
import { CommandSuggestion } from './CommandSuggestion'
import type { SuggestionItem } from './CommandSuggestion'
import { buildPreviewChips } from './taskChips'
import { sprintKeyFromRouteParam } from '@/features/properties/sprint/sprintDef'
import { SprintChip } from '@/features/properties/sprint/SprintChip'

interface TaskPreviewCardProps {
  parsed: ParseResult
  suggestions: SuggestionItem[]
  onSubmit: () => void
}

function sprintPreview(pathname: string, parsedSprintKey?: string): ReactNode | null {
  const now = new Date()
  if (parsedSprintKey) return <SprintChip sprint={parsedSprintKey} now={now} />
  if (pathname === '/backlog') return <SprintChip sprint={null} now={now} />
  const m = pathname.match(/^\/sprint\/(.+)$/)
  if (!m) return null
  return <SprintChip sprint={sprintKeyFromRouteParam(m[1], now)} now={now} />
}

export function TaskPreviewCard({ parsed, suggestions, onSubmit }: TaskPreviewCardProps) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.div
      className="bn-suggestions rounded-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
    >
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 pt-3 pb-1"
        onMouseDown={e => { e.preventDefault(); setCollapsed(c => !c) }}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand task preview' : 'Collapse task preview'}
      >
        <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">Task Preview</span>
        <ChevronDownIcon className={`size-[14px] text-white/40 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="preview-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            style={{ overflow: 'hidden' }}
          >
            <TaskResultRow
              emoji={parsed.emoji?.value ?? undefined}
              name={parsed.title || 'Untitled'}
              subtitle={sprintPreview(location.pathname, parsed.sprintKey?.value) ?? undefined}
              status={(parsed.status?.value ?? TaskStatus.TODO) as TaskStatus}
              chips={buildPreviewChips(parsed)}
              isPreview
              onSubmit={onSubmit}
            />
            {suggestions.length > 0 && (
              <>
                <p className="px-4 pt-1 pb-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                  Suggestions
                </p>
                <CommandSuggestion items={suggestions} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
