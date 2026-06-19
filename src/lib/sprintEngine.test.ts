import { describe, expect, it } from 'vitest'
import { sprintKey, sprintKeyOffset, classifySprintKey, compareSprintKeys } from './sprintEngine'

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
