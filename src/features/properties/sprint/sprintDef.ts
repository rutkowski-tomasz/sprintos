export type SprintLabel = 'past' | 'previous' | 'current' | 'next' | 'future'

export const SPRINT_LABEL_TEXT: Record<SprintLabel, string> = {
  current: 'Current',
  next: 'Next',
  future: 'Future',
  previous: 'Previous',
  past: 'Past',
}

export const SPRINT_LABEL_BADGE_CLASS: Record<SprintLabel, string> = {
  current: 'bg-blue-500/15 text-blue-400 border-transparent',
  next: 'bg-purple-500/15 text-purple-400 border-transparent',
  future: 'bg-zinc-500/15 text-zinc-400 border-transparent',
  previous: 'bg-amber-500/15 text-amber-400 border-transparent',
  past: 'bg-zinc-400/10 text-zinc-500 border-transparent',
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function sprintStartOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (d.getDay() + 1) % 7)
  return d
}

function quarterOf(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1
}

function firstSaturdayOfQuarter(year: number, quarter: number): Date {
  const d = new Date(year, (quarter - 1) * 3, 1)
  d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7)
  return d
}

export function sprintKey(date: Date): string {
  const sat = sprintStartOf(date)
  const year = sat.getFullYear()
  const q = quarterOf(sat)
  const firstSat = firstSaturdayOfQuarter(year, q)
  const week = Math.round((sat.getTime() - firstSat.getTime()) / MS_PER_WEEK) + 1
  return `${year % 100} Q${q} ${week}`
}

export function sprintKeyOffset(now: Date, weekOffset: number): string {
  const sat = sprintStartOf(now)
  sat.setDate(sat.getDate() + weekOffset * 7)
  return sprintKey(sat)
}

function sprintKeyOrdinal(key: string): number {
  const m = key.match(/^(\d+) Q(\d) (\d+)$/)
  if (!m) return 0
  return parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 + parseInt(m[3])
}

export function compareSprintKeys(a: string, b: string): number {
  return sprintKeyOrdinal(a) - sprintKeyOrdinal(b)
}

export function classifySprintKey(key: string, now: Date): SprintLabel {
  const current = sprintKey(now)
  if (key === current) return 'current'
  if (key === sprintKeyOffset(now, 1)) return 'next'
  if (key === sprintKeyOffset(now, -1)) return 'previous'
  return sprintKeyOrdinal(key) < sprintKeyOrdinal(current) ? 'past' : 'future'
}

export function formatSprintKey(key: string, now: Date): string {
  const m = key.match(/^(\d+) Q(\d) (\d+)$/)
  if (!m) return key
  const yy = parseInt(m[1])
  const q = parseInt(m[2])
  const w = m[3].padStart(2, '0')
  const nowYY = now.getFullYear() % 100
  const nowQ = Math.floor(now.getMonth() / 3) + 1
  if (yy === nowYY && q === nowQ) return w
  if (yy === nowYY) return `Q${q} ${w}`
  return `${m[1]} Q${q} ${w}`
}

export function sprintDateRange(key: string): { start: Date; end: Date } {
  const m = key.match(/^(\d+) Q(\d) (\d+)$/)
  if (!m) throw new Error(`Invalid sprint key: ${key}`)
  const year = 2000 + parseInt(m[1])
  const q = parseInt(m[2])
  const w = parseInt(m[3])
  const start = firstSaturdayOfQuarter(year, q)
  start.setDate(start.getDate() + (w - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end }
}

export function sprintKeyFromRouteParam(param: string, now: Date): string {
  if (param === 'current') return sprintKey(now)
  if (param === 'next') return sprintKeyOffset(now, 1)
  if (param === 'previous') return sprintKeyOffset(now, -1)
  const m = param.match(/^(\d+)-Q(\d)-(\d+)$/)
  if (!m) return sprintKey(now)
  return `${parseInt(m[1])} Q${parseInt(m[2])} ${parseInt(m[3])}`
}

export function generateSprintKeys(now: Date, yearsBefore = 1, yearsAfter = 1): string[] {
  const keys: string[] = []
  const year = now.getFullYear()
  const cursor = firstSaturdayOfQuarter(year - yearsBefore, 1)
  const limit = firstSaturdayOfQuarter(year + yearsAfter + 1, 1)
  while (cursor < limit) {
    keys.push(sprintKey(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return keys
}
