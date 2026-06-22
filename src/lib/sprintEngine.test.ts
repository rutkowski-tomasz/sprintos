import { describe, expect, it } from 'vitest'
import {
  classifySprintKey,
  compareSprintKeys,
  formatSprintKey,
  generateSprintKeys,
  sprintDateRange,
  sprintKey,
  sprintKeyOffset,
} from './sprintEngine'

// Reference: 2026-06-19 is a Friday.
// Sprint cycle: Saturday–Friday.
// Current sprint started Saturday 2026-06-13.
// Q2 2026 starts April 1 (Wednesday); first Saturday = April 4.
// Weeks from April 4: +0=Apr4, +7=Apr11, ..., +70=Jun13 → week 11.
// Current sprint key: "26 Q2 11"
const NOW = new Date('2026-06-19T10:00:00')

describe('sprintKey', () => {
  it('returns the key for the sprint containing the given date', () => {
    expect(sprintKey(NOW)).toBe('26 Q2 11')
  })

  it('returns the same key for Saturday (sprint start)', () => {
    expect(sprintKey(new Date('2026-06-13T00:00:00'))).toBe('26 Q2 11')
  })

  it('returns the same key for Friday (sprint end)', () => {
    expect(sprintKey(new Date('2026-06-19T23:59:59'))).toBe('26 Q2 11')
  })

  it('advances to next sprint on the following Saturday', () => {
    expect(sprintKey(new Date('2026-06-20T00:00:00'))).toBe('26 Q2 12')
  })

  it('handles quarter boundary: last week of Q2 into Q3', () => {
    // Q2 2026: April 4 – ~June 27 (13 weeks). Week 13 starts June 27.
    expect(sprintKey(new Date('2026-06-27T00:00:00'))).toBe('26 Q2 13')
    // Q3 2026: first Saturday on/after July 1 = July 4. Week 1 starts July 4.
    expect(sprintKey(new Date('2026-07-04T00:00:00'))).toBe('26 Q3 1')
  })
})

describe('sprintKeyOffset', () => {
  it('returns next sprint key at offset +1', () => {
    expect(sprintKeyOffset(NOW, 1)).toBe('26 Q2 12')
  })

  it('returns previous sprint key at offset -1', () => {
    expect(sprintKeyOffset(NOW, -1)).toBe('26 Q2 10')
  })

  it('returns current sprint key at offset 0', () => {
    expect(sprintKeyOffset(NOW, 0)).toBe('26 Q2 11')
  })
})

describe('classifySprintKey', () => {
  it('classifies current sprint', () => {
    expect(classifySprintKey('26 Q2 11', NOW)).toBe('current')
  })

  it('classifies next sprint', () => {
    expect(classifySprintKey('26 Q2 12', NOW)).toBe('next')
  })

  it('classifies previous sprint', () => {
    expect(classifySprintKey('26 Q2 10', NOW)).toBe('previous')
  })

  it('classifies a sprint two weeks ago as past', () => {
    expect(classifySprintKey('26 Q2 9', NOW)).toBe('past')
  })

  it('classifies a sprint two weeks ahead as future', () => {
    expect(classifySprintKey('26 Q2 13', NOW)).toBe('future')
  })

  it('classifies a different quarter in the future as future', () => {
    expect(classifySprintKey('26 Q3 1', NOW)).toBe('future')
  })

  it('classifies a different quarter in the past as past', () => {
    expect(classifySprintKey('26 Q1 1', NOW)).toBe('past')
  })
})

describe('compareSprintKeys', () => {
  it('returns negative when a is before b', () => {
    expect(compareSprintKeys('26 Q2 11', '26 Q2 12')).toBeLessThan(0)
  })

  it('returns positive when a is after b', () => {
    expect(compareSprintKeys('26 Q3 1', '26 Q2 13')).toBeGreaterThan(0)
  })

  it('returns 0 for equal keys', () => {
    expect(compareSprintKeys('26 Q2 11', '26 Q2 11')).toBe(0)
  })
})

// NOW = 2026-06-19: current year = 26, current quarter = 2
describe('formatSprintKey', () => {
  it('returns just the week when in the current year and quarter', () => {
    expect(formatSprintKey('26 Q2 11', NOW)).toBe('11')
  })

  it('zero-pads a single-digit week in the current quarter', () => {
    expect(formatSprintKey('26 Q2 1', NOW)).toBe('01')
  })

  it('returns quarter+week when same year but different quarter', () => {
    expect(formatSprintKey('26 Q1 13', NOW)).toBe('Q1 13')
    expect(formatSprintKey('26 Q4 9', NOW)).toBe('Q4 09')
  })

  it('zero-pads a single-digit week for a different quarter in the same year', () => {
    expect(formatSprintKey('26 Q3 1', NOW)).toBe('Q3 01')
  })

  it('returns the full key for a different year', () => {
    expect(formatSprintKey('25 Q2 11', NOW)).toBe('25 Q2 11')
    expect(formatSprintKey('27 Q4 13', NOW)).toBe('27 Q4 13')
  })

  it('zero-pads a single-digit week for a different year', () => {
    expect(formatSprintKey('27 Q1 1', NOW)).toBe('27 Q1 01')
  })
})

// Q2 2026: first Saturday = Apr 4. Week 11 start = Apr 4 + 70 days = Jun 13.
// Q3 2026: first Saturday = Jul 4 (Jul 1 is Wed; +3 days).
// Q1 2026: first Saturday = Jan 3 (Jan 1 is Thu; +2 days).
describe('sprintDateRange', () => {
  it('returns the correct start (Saturday) and end (Friday) for a known sprint', () => {
    const { start, end } = sprintDateRange('26 Q2 11')
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(5) // June (0-indexed)
    expect(start.getDate()).toBe(13)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(5)
    expect(end.getDate()).toBe(19)
  })

  it('start is always a Saturday', () => {
    expect(sprintDateRange('26 Q2 11').start.getDay()).toBe(6)
    expect(sprintDateRange('26 Q3 1').start.getDay()).toBe(6)
    expect(sprintDateRange('26 Q1 1').start.getDay()).toBe(6)
  })

  it('end is always a Friday', () => {
    expect(sprintDateRange('26 Q2 11').end.getDay()).toBe(5)
    expect(sprintDateRange('26 Q3 1').end.getDay()).toBe(5)
    expect(sprintDateRange('26 Q1 1').end.getDay()).toBe(5)
  })

  it('span is always 6 days', () => {
    const { start, end } = sprintDateRange('26 Q2 11')
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    expect(days).toBe(6)
  })

  it('first sprint of Q2 2026 starts Apr 4', () => {
    const { start } = sprintDateRange('26 Q2 1')
    expect(start.getMonth()).toBe(3) // April
    expect(start.getDate()).toBe(4)
  })

  it('first sprint of Q3 2026 starts Jul 4', () => {
    const { start } = sprintDateRange('26 Q3 1')
    expect(start.getMonth()).toBe(6) // July
    expect(start.getDate()).toBe(4)
  })

  it('first sprint of Q1 2026 starts Jan 3', () => {
    const { start } = sprintDateRange('26 Q1 1')
    expect(start.getMonth()).toBe(0) // January
    expect(start.getDate()).toBe(3)
  })

  it('consecutive sprints are adjacent (no gap, no overlap)', () => {
    const { end: end11 } = sprintDateRange('26 Q2 11')
    const { start: start12 } = sprintDateRange('26 Q2 12')
    const gap = (start12.getTime() - end11.getTime()) / (1000 * 60 * 60 * 24)
    expect(gap).toBe(1)
  })

  it('throws for an invalid key', () => {
    expect(() => sprintDateRange('invalid')).toThrow()
  })
})

// generateSprintKeys(NOW, 1, 1):
//   cursor starts at firstSat(Q1 2025) = Jan 4 → "25 Q1 1"
//   limit   is   firstSat(Q1 2027) = Jan 2, 2027 (exclusive)
//   last sprint  = Dec 26, 2026 → "26 Q4 13"
describe('generateSprintKeys', () => {
  it('includes the current sprint', () => {
    expect(generateSprintKeys(NOW, 1, 1)).toContain('26 Q2 11')
  })

  it('starts at Q1 of (currentYear - yearsBefore)', () => {
    expect(generateSprintKeys(NOW, 1, 1)[0]).toBe('25 Q1 1')
  })

  it('ends at the last sprint of Q4 of (currentYear + yearsAfter)', () => {
    const keys = generateSprintKeys(NOW, 1, 1)
    expect(keys[keys.length - 1]).toBe('27 Q4 13')
  })

  it('with yearsBefore=0 yearsAfter=0, covers only the current year', () => {
    const keys = generateSprintKeys(NOW, 0, 0)
    expect(keys.every(k => k.startsWith('26'))).toBe(true)
    expect(keys[0]).toBe('26 Q1 1')
    expect(keys[keys.length - 1]).toBe('26 Q4 13')
  })

  it('keys are in ascending order', () => {
    const keys = generateSprintKeys(NOW, 1, 1)
    for (let i = 1; i < keys.length; i++) {
      expect(compareSprintKeys(keys[i - 1], keys[i])).toBeLessThan(0)
    }
  })

  it('has no duplicate keys', () => {
    const keys = generateSprintKeys(NOW, 1, 1)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('all keys match the sprint key format', () => {
    const keys = generateSprintKeys(NOW, 1, 1)
    for (const k of keys) expect(k).toMatch(/^\d+ Q[1-4] \d+$/)
  })
})
