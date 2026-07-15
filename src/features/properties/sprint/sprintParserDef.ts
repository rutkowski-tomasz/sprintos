import type { ParseHit, ParseContext, PropertyParser, Token } from '../parser'
import { sprintKeyOffset } from './sprintDef'

export const SPRINT_COLOR = '#f472b6'

const EXACT_RE = /^(\d{2})q(\d)(\d{1,2})$/i
const QUARTER_WEEK_RE = /^q(\d)(\d{1,2})$/i
const WEEK_RE = /^s(\d{1,2})$/i
const KEYWORD_RE = /^s(next|previous|current|future|past)$/i

const KEYWORD_OFFSET: Record<string, number> = {
  current: 0,
  next: 1,
  previous: -1,
  future: 2,
  past: -2,
}

const SEARCH_WEEKS_AHEAD = 60

function parseSprintKeyParts(key: string): { yy: number; q: number; week: number } | null {
  const m = key.match(/^(\d+) Q(\d) (\d+)$/)
  if (!m) return null
  return { yy: parseInt(m[1]), q: parseInt(m[2]), week: parseInt(m[3]) }
}

// Week/quarter alone don't pin a year, so we resolve to the nearest current-or-future
// sprint that matches — never a past one.
function findUpcomingSprintKey(now: Date, matches: (parts: { yy: number; q: number; week: number }) => boolean): string | null {
  for (let weekOffset = 0; weekOffset < SEARCH_WEEKS_AHEAD; weekOffset++) {
    const key = sprintKeyOffset(now, weekOffset)
    const parts = parseSprintKeyParts(key)
    if (parts && matches(parts)) return key
  }
  return null
}

export const sprintParser: PropertyParser = {
  key: 'sprintKey',
  parse(tokens: Token[], { now }: ParseContext): ParseHit | null {
    for (let i = 0; i < tokens.length; i++) {
      const text = tokens[i].text

      const keyword = KEYWORD_RE.exec(text)
      if (keyword) {
        const offset = KEYWORD_OFFSET[keyword[1].toLowerCase()]
        const value = sprintKeyOffset(now, offset)
        return { consume: [i], start: tokens[i].start, end: tokens[i].end, value }
      }

      const exact = EXACT_RE.exec(text)
      if (exact) {
        const yy = parseInt(exact[1]), q = parseInt(exact[2]), week = parseInt(exact[3])
        if (q >= 1 && q <= 4 && week >= 1) {
          return { consume: [i], start: tokens[i].start, end: tokens[i].end, value: `${yy} Q${q} ${week}` }
        }
      }

      const qWeek = QUARTER_WEEK_RE.exec(text)
      if (qWeek) {
        const q = parseInt(qWeek[1]), week = parseInt(qWeek[2])
        if (q >= 1 && q <= 4 && week >= 1) {
          const found = findUpcomingSprintKey(now, p => p.q === q && p.week === week)
          if (found) return { consume: [i], start: tokens[i].start, end: tokens[i].end, value: found }
        }
      }

      const weekOnly = WEEK_RE.exec(text)
      if (weekOnly) {
        const week = parseInt(weekOnly[1])
        if (week >= 1) {
          const found = findUpcomingSprintKey(now, p => p.week === week)
          if (found) return { consume: [i], start: tokens[i].start, end: tokens[i].end, value: found }
        }
      }
    }
    return null
  },
}
