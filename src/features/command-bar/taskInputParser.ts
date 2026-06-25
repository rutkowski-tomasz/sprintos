import type { Goal } from '@/types'
import { TaskStatus } from '@/types'

export interface ParsedFields {
  name: string
  emoji: string | null
  eventDate: string | null
  status: TaskStatus | null
  snooze: string | null   // ISO string | "-{seconds}" for relative-to-event
  duration: number | null // seconds
  goalId: string | null
  sourceUrl: string | null
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
}

const DAYS: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2,
  wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

function parseDurationSecs(s: string): number | null {
  const hm = s.match(/^(\d+(?:\.\d+)?)h(\d+)m$/i)
  if (hm) return Math.round(parseFloat(hm[1]) * 3600) + parseInt(hm[2]) * 60
  const h = s.match(/^(\d+(?:\.\d+)?)h$/i)
  if (h) return Math.round(parseFloat(h[1]) * 3600)
  const m = s.match(/^(\d+)m$/i)
  if (m) return parseInt(m[1]) * 60
  const d = s.match(/^(\d+)d$/i)
  if (d) return parseInt(d[1]) * 86400
  return null
}

function isTimeToken(s: string): boolean {
  return /^\d{1,2}(:\d{2})?$/.test(s)
}

function applyTime(date: Date, token: string): void {
  const [h, m = '0'] = token.split(':')
  date.setHours(parseInt(h), parseInt(m), 0, 0)
}

function bumpYearIfPast(date: Date, now: Date): Date {
  if (date <= now) date.setFullYear(date.getFullYear() + 1)
  return date
}

function parseDate(tokens: string[], now: Date): { date: Date; consumed: number } | null {
  if (!tokens.length) return null
  const t0 = tokens[0].toLowerCase()

  if (t0 === 'today' || t0 === 'tmrw' || t0 === 'tomorrow') {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    if (t0 !== 'today') d.setDate(d.getDate() + 1)
    let consumed = 1
    if (tokens[1] && isTimeToken(tokens[1])) { applyTime(d, tokens[1]); consumed = 2 }
    return { date: d, consumed }
  }

  if (t0 in DAYS) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    const diff = (DAYS[t0] - d.getDay() + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    let consumed = 1
    if (tokens[1] && isTimeToken(tokens[1])) { applyTime(d, tokens[1]); consumed = 2 }
    return { date: d, consumed }
  }

  const ord = t0.match(/^(\d{1,2})(st|nd|rd|th)$/)
  if (ord && tokens[1] && tokens[1].toLowerCase() in MONTHS) {
    const d = new Date(now)
    d.setMonth(MONTHS[tokens[1].toLowerCase()], parseInt(ord[1]))
    d.setHours(0, 0, 0, 0)
    let consumed = 2
    if (tokens[2] && /^\d{1,2}:\d{2}$/.test(tokens[2])) { applyTime(d, tokens[2]); consumed = 3 }
    return { date: bumpYearIfPast(d, now), consumed }
  }

  const dm = t0.match(/^(\d{1,2})\.(\d{1,2})$/)
  if (dm) {
    const d = new Date(now)
    d.setMonth(parseInt(dm[2]) - 1, parseInt(dm[1]))
    d.setHours(0, 0, 0, 0)
    let consumed = 1
    if (tokens[1] && /^\d{1,2}:\d{2}$/.test(tokens[1])) { applyTime(d, tokens[1]); consumed = 2 }
    return { date: bumpYearIfPast(d, now), consumed }
  }

  return null
}

function fuzzyMatch(prefix: string, goals: Pick<Goal, 'id' | 'name'>[]): string | null {
  const q = prefix.toLowerCase()
  return goals.find(g => g.name.toLowerCase().includes(q))?.id ?? null
}

export function parseTaskInput(
  input: string,
  goals: Pick<Goal, 'id' | 'name'>[] = [],
  now: Date = new Date(),
): ParsedFields {
  let rest = input.trim()
  let emoji: string | null = null
  let sourceUrl: string | null = null
  let status: TaskStatus | null = null
  let snooze: string | null = null
  let duration: number | null = null
  let goalId: string | null = null
  let eventDate: string | null = null

  // 1. Leading emoji — Intl.Segmenter handles multi-codepoint sequences (e.g. 🏋️)
  const firstSeg = [...new Intl.Segmenter().segment(rest)][0]
  if (firstSeg && /\p{Extended_Pictographic}/u.test(firstSeg.segment)) {
    emoji = firstSeg.segment
    rest = rest.slice(firstSeg.segment.length).trimStart()
  }

  // 2. Bare URL
  rest = rest.replace(/https?:\/\/\S+/g, url => { if (!sourceUrl) sourceUrl = url; return '' }).trim()

  // 3. Status keyword — negative lookbehind prevents matching @next
  const statusM = rest.match(/(?<!@)\b(to do|in progress|progress?|todo|next|done|archive)\b/i)
  if (statusM) {
    const kw = statusM[1].toLowerCase()
    status =
      kw === 'todo' || kw === 'to do' ? TaskStatus.TODO
      : kw === 'next' ? TaskStatus.NEXT
      : kw === 'in progress' || kw.startsWith('progres') ? TaskStatus.IN_PROGRESS
      : kw === 'done' ? TaskStatus.DONE
      : TaskStatus.ARCHIVED
    rest = (rest.slice(0, statusM.index) + rest.slice(statusM.index! + statusM[0].length)).trim()
  }

  // 4. Snooze token (@ prefix)
  const atIdx = rest.indexOf('@')
  if (atIdx !== -1) {
    const afterAt = rest.slice(atIdx + 1).trimStart()
    const atTokens = afterAt.split(/\s+/).filter(Boolean)
    const first = atTokens[0] ?? ''
    let consumed = 0

    const negDur = first.match(/^-(\d+(?:\.\d+)?h\d+m|\d+(?:\.\d+)?[hd])$/i)
    const posDur = !negDur && first.match(/^(\d+(?:\.\d+)?h\d+m|\d+(?:\.\d+)?[hd])$/i)

    if (negDur) {
      const secs = parseDurationSecs(negDur[1])
      if (secs !== null) { snooze = `-${secs}`; consumed = first.length }
    } else if (posDur) {
      const secs = parseDurationSecs(first)
      if (secs !== null) {
        snooze = new Date(now.getTime() + secs * 1000).toISOString()
        consumed = first.length
      }
    } else {
      const parsed = parseDate(atTokens, now)
      if (parsed) {
        snooze = parsed.date.toISOString()
        consumed = atTokens.slice(0, parsed.consumed).join(' ').length
      }
    }

    if (snooze !== null) {
      rest = (rest.slice(0, atIdx) + afterAt.slice(consumed).trimStart()).trim()
    }
  }

  // 5. Duration
  const durM = rest.match(/\b(\d+(?:\.\d+)?h\d+m|\d+(?:\.\d+)?h|\d+m)\b/i)
  if (durM) {
    duration = parseDurationSecs(durM[1])
    rest = (rest.slice(0, durM.index) + rest.slice(durM.index! + durM[0].length)).trim()
  }

  // 6. Goal prefix (#word → fuzzy match against goal names)
  const goalM = rest.match(/#(\w+)/)
  if (goalM) {
    goalId = fuzzyMatch(goalM[1], goals)
    rest = (rest.slice(0, goalM.index) + rest.slice(goalM.index! + goalM[0].length)).trim()
  }

  // 7. Event date — scan remaining tokens for a date pattern
  const tokens = rest.split(/\s+/).filter(Boolean)
  for (let i = 0; i < tokens.length; i++) {
    const parsed = parseDate(tokens.slice(i), now)
    if (parsed) {
      eventDate = parsed.date.toISOString()
      tokens.splice(i, parsed.consumed)
      break
    }
  }

  // 8. Emoji anywhere in remaining tokens (if no leading emoji was found)
  if (!emoji) {
    for (let i = 0; i < tokens.length; i++) {
      const segs = [...new Intl.Segmenter().segment(tokens[i])]
      if (segs.length === 1 && /\p{Extended_Pictographic}/u.test(segs[0].segment)) {
        emoji = tokens[i]
        tokens.splice(i, 1)
        break
      }
    }
  }

  return { name: tokens.join(' '), emoji, eventDate, status, snooze, duration, goalId, sourceUrl }
}
