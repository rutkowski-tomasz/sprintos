import type { Task } from '@/types'

export interface EventDateSuggestion {
  label: string
  tokenText: string
}

export interface SimilarTaskSuggestions {
  emojis: string[]
  durations: number[]
  eventDates: EventDateSuggestion[]
}

export const EMPTY_SUGGESTIONS: SimilarTaskSuggestions = { emojis: [], durations: [], eventDates: [] }

const WEEKDAY_TOKENS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function suggestDurations(tasks: Task[], max = 3): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const task of tasks) {
    if (task.duration == null || seen.has(task.duration)) continue
    seen.add(task.duration)
    out.push(task.duration)
    if (out.length >= max) break
  }
  return out
}

export function suggestEventDate(task: Task | null): EventDateSuggestion | null {
  if (!task?.eventDate) return null
  const d = new Date(task.eventDate)
  const weekday = WEEKDAY_TOKENS[d.getDay()]
  const label = WEEKDAY_LABELS[d.getDay()]
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  if (!hasTime) return { label, tokenText: weekday }
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return { label: `${label} ${hh}:${mm}`, tokenText: `${weekday} ${hh}:${mm}` }
}

export function suggestEventDates(tasks: Task[], max = 3): EventDateSuggestion[] {
  const seen = new Set<string>()
  const out: EventDateSuggestion[] = []
  for (const task of tasks) {
    const suggestion = suggestEventDate(task)
    if (!suggestion || seen.has(suggestion.tokenText)) continue
    seen.add(suggestion.tokenText)
    out.push(suggestion)
    if (out.length >= max) break
  }
  return out
}

export function formatDurationToken(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h && m) return `${h}h${m}m`
  if (h) return `${h}h`
  return `${m}m`
}
