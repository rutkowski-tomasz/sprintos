import { describe, expect, it } from 'vitest'
import type { Sprint } from '@/types'
import { classifySprints, missedRollovers } from './sprintEngine'

function sprint(id: string, startDate: string, endDate: string): Sprint {
  return { id, userId: 'u1', name: id, startDate, endDate, version: 1, createdAt: '', updatedAt: '', deletedAt: null }
}

// Calendar reference (June 2025, Sat–Fri cycles):
// w1: May 31–Jun  6  (past)
// w2: Jun  7–Jun 13  (previous)
// w3: Jun 14–Jun 20  (current)   ← NOW is Jun 19 Thu
// w4: Jun 21–Jun 27  (next)
// w5: Jun 28–Jul  4  (future)
// w6: Jul  5–Jul 11  (future)
const w1 = sprint('w1', '2025-05-31', '2025-06-06')
const w2 = sprint('w2', '2025-06-07', '2025-06-13')
const w3 = sprint('w3', '2025-06-14', '2025-06-20')
const w4 = sprint('w4', '2025-06-21', '2025-06-27')
const w5 = sprint('w5', '2025-06-28', '2025-07-04')
const w6 = sprint('w6', '2025-07-05', '2025-07-11')
const ALL = [w1, w2, w3, w4, w5, w6]

const NOW = new Date('2025-06-19T10:00:00')

describe('classifySprints', () => {
  it('labels a nominal set of 6 sprints correctly', () => {
    const labels = classifySprints(ALL, NOW)
    expect(labels.get('w1')).toBe('past')
    expect(labels.get('w2')).toBe('previous')
    expect(labels.get('w3')).toBe('current')
    expect(labels.get('w4')).toBe('next')
    expect(labels.get('w5')).toBe('future')
    expect(labels.get('w6')).toBe('future')
  })

  it('now exactly on startDate is current', () => {
    const labels = classifySprints(ALL, new Date('2025-06-14T00:00:00'))
    expect(labels.get('w3')).toBe('current')
  })

  it('now exactly on endDate is still current', () => {
    const labels = classifySprints(ALL, new Date('2025-06-20T23:59:59'))
    expect(labels.get('w3')).toBe('current')
  })

  it('returns empty map for no sprints', () => {
    expect(classifySprints([], NOW).size).toBe(0)
  })

  it('works with a single sprint that is current', () => {
    const labels = classifySprints([w3], NOW)
    expect(labels.get('w3')).toBe('current')
    expect(labels.size).toBe(1)
  })
})

describe('missedRollovers', () => {
  it('returns 0 when inside an active sprint', () => {
    expect(missedRollovers(ALL, NOW)).toBe(0)
  })

  it('returns 0 for an empty sprint list', () => {
    expect(missedRollovers([], NOW)).toBe(0)
  })

  it('returns 1 when one week has passed since the last sprint ended', () => {
    // last sprint ended Jun 13 (Fri); now is Jun 19 (Thu) — one Saturday boundary passed (Jun 14)
    expect(missedRollovers([w1, w2], NOW)).toBe(1)
  })

  it('returns 3 when three weeks have passed since the last sprint ended', () => {
    // last sprint ended Jun 13; now is Jul 3 — three Saturday boundaries: Jun 14, Jun 21, Jun 28
    expect(missedRollovers([w1, w2], new Date('2025-07-03T10:00:00'))).toBe(3)
  })

  it('returns 0 when now is still before the first rollover Saturday', () => {
    // last sprint ended Jun 13; now is Jun 13 at 23:00 — no Saturday has passed yet
    expect(missedRollovers([w1, w2], new Date('2025-06-13T23:00:00'))).toBe(0)
  })
})
