import type { Sprint } from '@/types'

export type SprintLabel = 'past' | 'previous' | 'current' | 'next' | 'future'

function dayStart(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

function dayEnd(dateStr: string): Date {
  return new Date(dateStr + 'T23:59:59.999')
}

export function classifySprints(sprints: Sprint[], now: Date): Map<string, SprintLabel> {
  const result = new Map<string, SprintLabel>()
  if (sprints.length === 0) return result

  const ended = sprints
    .filter(s => dayEnd(s.endDate) < now)
    .sort((a, b) => dayEnd(b.endDate).getTime() - dayEnd(a.endDate).getTime())

  const upcoming = sprints
    .filter(s => dayStart(s.startDate) > now)
    .sort((a, b) => dayStart(a.startDate).getTime() - dayStart(b.startDate).getTime())

  const current = sprints.find(
    s => dayStart(s.startDate) <= now && dayEnd(s.endDate) >= now,
  )

  if (current) result.set(current.id, 'current')
  if (ended[0]) result.set(ended[0].id, 'previous')
  ended.slice(1).forEach(s => result.set(s.id, 'past'))
  if (upcoming[0]) result.set(upcoming[0].id, 'next')
  upcoming.slice(1).forEach(s => result.set(s.id, 'future'))

  return result
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

export function missedRollovers(sprints: Sprint[], now: Date): number {
  if (sprints.length === 0) return 0

  const latestEnd = sprints
    .map(s => dayEnd(s.endDate))
    .reduce((max, d) => (d > max ? d : max))

  if (now <= latestEnd) return 0

  const firstRollover = new Date(latestEnd)
  firstRollover.setDate(firstRollover.getDate() + 1)
  firstRollover.setHours(0, 0, 0, 0)

  if (firstRollover > now) return 0

  return Math.floor((now.getTime() - firstRollover.getTime()) / MS_PER_WEEK) + 1
}
