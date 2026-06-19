export type SprintLabel = 'past' | 'previous' | 'current' | 'next' | 'future'

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

function keyOrd(key: string): number {
  const m = key.match(/^(\d+) Q(\d) (\d+)$/)
  if (!m) return 0
  return parseInt(m[1]) * 1000 + parseInt(m[2]) * 100 + parseInt(m[3])
}

export function compareSprintKeys(a: string, b: string): number {
  return keyOrd(a) - keyOrd(b)
}

export function classifySprintKey(key: string, now: Date): SprintLabel {
  const current = sprintKey(now)
  if (key === current) return 'current'
  if (key === sprintKeyOffset(now, 1)) return 'next'
  if (key === sprintKeyOffset(now, -1)) return 'previous'
  return keyOrd(key) < keyOrd(current) ? 'past' : 'future'
}
