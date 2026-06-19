import { describe, expect, it } from 'vitest'
import type { Goal } from '@/types'
import { TaskStatus } from '@/types'
import { parseTaskInput } from './parser'

// Fixed reference point: Wednesday 15 Jan 2025 10:00 local time
const NOW = new Date('2025-01-15T10:00:00')

const GOALS: Pick<Goal, 'id' | 'name'>[] = [
  { id: 'g1', name: 'Health & Fitness' },
  { id: 'g2', name: 'Work Projects' },
]

// Extract local date components from an ISO string for timezone-safe assertions
function local(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return { y: d.getFullYear(), mo: d.getMonth(), day: d.getDate(), h: d.getHours(), m: d.getMinutes() }
}

describe('parseTaskInput', () => {
  it('parses the full roadmap example correctly', () => {
    const r = parseTaskInput('🏋️ Vet 1st June 12:00 progres @-1d 30m #health', GOALS, NOW)
    expect(r.emoji).toBe('🏋️')
    expect(r.name).toBe('Vet')
    expect(local(r.eventDate)).toMatchObject({ y: 2025, mo: 5, day: 1, h: 12, m: 0 })
    expect(r.status).toBe(TaskStatus.IN_PROGRESS)
    expect(r.snooze).toBe('-86400')
    expect(r.duration).toBe(1800)
    expect(r.goalId).toBe('g1')
    expect(r.sourceUrl).toBeNull()
  })

  it('returns name only when no tokens present', () => {
    const r = parseTaskInput('Buy milk', [], NOW)
    expect(r.name).toBe('Buy milk')
    expect(r.emoji).toBeNull()
    expect(r.eventDate).toBeNull()
    expect(r.status).toBeNull()
    expect(r.snooze).toBeNull()
    expect(r.duration).toBeNull()
    expect(r.goalId).toBeNull()
    expect(r.sourceUrl).toBeNull()
  })

  describe('emoji', () => {
    it('extracts a leading multi-codepoint emoji', () => {
      const r = parseTaskInput('🏋️ Gym session', [], NOW)
      expect(r.emoji).toBe('🏋️')
      expect(r.name).toBe('Gym session')
    })

    it('extracts a simple emoji', () => {
      const r = parseTaskInput('📚 Read book', [], NOW)
      expect(r.emoji).toBe('📚')
      expect(r.name).toBe('Read book')
    })

    it('does not treat a letter as emoji', () => {
      expect(parseTaskInput('Read book', [], NOW).emoji).toBeNull()
    })
  })

  describe('sourceUrl', () => {
    it('extracts a bare URL and removes it from the name', () => {
      const r = parseTaskInput('Check https://example.com notes', [], NOW)
      expect(r.sourceUrl).toBe('https://example.com')
      expect(r.name).toBe('Check notes')
    })
  })

  describe('status', () => {
    it.each([
      ['todo', TaskStatus.TODO],
      ['to do', TaskStatus.TODO],
      ['next', TaskStatus.NEXT],
      ['progress', TaskStatus.IN_PROGRESS],
      ['progres', TaskStatus.IN_PROGRESS],
      ['in progress', TaskStatus.IN_PROGRESS],
      ['done', TaskStatus.DONE],
      ['archive', TaskStatus.ARCHIVED],
    ])('"%s" → status %i', (kw, expected) => {
      expect(parseTaskInput(`Fix bug ${kw}`, [], NOW).status).toBe(expected)
    })

    it('is case-insensitive', () => {
      expect(parseTaskInput('task DONE', [], NOW).status).toBe(TaskStatus.DONE)
    })
  })

  describe('duration', () => {
    it.each([
      ['30m', 1800],
      ['1h', 3600],
      ['1h30m', 5400],
      ['1.5h', 5400],
      ['2h', 7200],
    ])('"%s" → %i seconds', (token, secs) => {
      expect(parseTaskInput(`task ${token}`, [], NOW).duration).toBe(secs)
    })
  })

  describe('snooze', () => {
    it('@-1d stores negative offset in seconds', () => {
      expect(parseTaskInput('task @-1d', [], NOW).snooze).toBe('-86400')
    })

    it('@-2h stores negative offset in seconds', () => {
      expect(parseTaskInput('task @-2h', [], NOW).snooze).toBe('-7200')
    })

    it('@1d stores ISO relative to now', () => {
      const expected = new Date(NOW.getTime() + 86400_000).toISOString()
      expect(parseTaskInput('task @1d', [], NOW).snooze).toBe(expected)
    })

    it('@Mon stores ISO of next Monday', () => {
      // NOW is Wed Jan 15; next Monday is Jan 20
      const snooze = parseTaskInput('task @Mon', [], NOW).snooze
      expect(local(snooze)).toMatchObject({ y: 2025, mo: 0, day: 20, h: 0, m: 0 })
    })

    it('@tmrw stores ISO of tomorrow midnight', () => {
      const snooze = parseTaskInput('task @tmrw', [], NOW).snooze
      expect(local(snooze)).toMatchObject({ y: 2025, mo: 0, day: 16, h: 0, m: 0 })
    })
  })

  describe('goal', () => {
    it('fuzzy-matches goal by prefix and returns goalId', () => {
      expect(parseTaskInput('task #health', GOALS, NOW).goalId).toBe('g1')
      expect(parseTaskInput('task #work', GOALS, NOW).goalId).toBe('g2')
    })

    it('returns null when no goals provided', () => {
      expect(parseTaskInput('task #health', [], NOW).goalId).toBeNull()
    })

    it('returns null when no goal matches', () => {
      expect(parseTaskInput('task #random', GOALS, NOW).goalId).toBeNull()
    })
  })

  describe('eventDate', () => {
    it('ordinal + month: "1st June 12:00"', () => {
      const r = parseTaskInput('Meet 1st June 12:00', [], NOW)
      expect(local(r.eventDate)).toMatchObject({ y: 2025, mo: 5, day: 1, h: 12, m: 0 })
      expect(r.name).toBe('Meet')
    })

    it('day of week: "Mon" resolves to next Monday', () => {
      // NOW = Wed Jan 15; next Mon = Jan 20
      expect(local(parseTaskInput('task Mon', [], NOW).eventDate))
        .toMatchObject({ mo: 0, day: 20 })
    })

    it('day of week with time: "Tue 13:12"', () => {
      // NOW = Wed Jan 15; next Tue = Jan 21
      expect(local(parseTaskInput('task Tue 13:12', [], NOW).eventDate))
        .toMatchObject({ mo: 0, day: 21, h: 13, m: 12 })
    })

    it('relative: "today 12:00"', () => {
      expect(local(parseTaskInput('task today 12:00', [], NOW).eventDate))
        .toMatchObject({ y: 2025, mo: 0, day: 15, h: 12, m: 0 })
    })

    it('relative: "tmrw 13"', () => {
      expect(local(parseTaskInput('task tmrw 13', [], NOW).eventDate))
        .toMatchObject({ y: 2025, mo: 0, day: 16, h: 13, m: 0 })
    })

    it('DD.MM: "01.06 12:00"', () => {
      expect(local(parseTaskInput('task 01.06 12:00', [], NOW).eventDate))
        .toMatchObject({ mo: 5, day: 1, h: 12, m: 0 })
    })

    it('bumps to next year when date is in the past', () => {
      // NOW = Jan 15 2025; "1st Jan" would be Jan 1 2025 (past) → Jan 1 2026
      const r = parseTaskInput('task 1st Jan', [], NOW)
      expect(local(r.eventDate)?.y).toBe(2026)
    })
  })
})
