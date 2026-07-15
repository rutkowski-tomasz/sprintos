import { describe, expect, it } from 'vitest'
import { formatDurationToken, suggestDurations, suggestEventDate, suggestEventDates } from './similarTaskSuggestions'
import { parse } from './taskInputParser'
import { TaskStatus, type Task } from '@/types'

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    userId: 'u1',
    sprint: null,
    goalId: null,
    name: 'Task',
    emoji: null,
    status: TaskStatus.TODO,
    eventDate: null,
    snooze: null,
    description: null,
    sourceUrl: null,
    duration: null,
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    embedding: null,
    ...overrides,
  }
}

describe('suggestDurations', () => {
  it('collects durations in order', () => {
    const tasks = [makeTask({ duration: 1800 }), makeTask({ duration: 3600 })]
    expect(suggestDurations(tasks)).toEqual([1800, 3600])
  })

  it('removes duplicates', () => {
    const tasks = [makeTask({ duration: 1800 }), makeTask({ duration: 1800 }), makeTask({ duration: 3600 })]
    expect(suggestDurations(tasks)).toEqual([1800, 3600])
  })

  it('skips tasks with no duration', () => {
    const tasks = [makeTask({ duration: null }), makeTask({ duration: 1800 })]
    expect(suggestDurations(tasks)).toEqual([1800])
  })

  it('caps at 3 by default', () => {
    const tasks = [1800, 3600, 5400, 7200].map(duration => makeTask({ duration }))
    expect(suggestDurations(tasks)).toEqual([1800, 3600, 5400])
  })

  it('honors a custom max', () => {
    const tasks = [1800, 3600, 5400].map(duration => makeTask({ duration }))
    expect(suggestDurations(tasks, 1)).toEqual([1800])
  })
})

describe('suggestEventDate', () => {
  it('returns null when there is no reference task', () => {
    expect(suggestEventDate(null)).toBeNull()
  })

  it('returns null when the reference task has no event date', () => {
    expect(suggestEventDate(makeTask({ eventDate: null }))).toBeNull()
  })

  it('extracts weekday and time as a lowercase parseable token', () => {
    const task = makeTask({ eventDate: new Date(2026, 0, 5, 12, 0).toISOString() }) // Mon Jan 5 2026, 12:00
    expect(suggestEventDate(task)).toEqual({ label: 'Mon 12:00', tokenText: 'monday 12:00' })
  })

  it('omits the time token when the reference date has no time-of-day set', () => {
    const task = makeTask({ eventDate: new Date(2026, 0, 5, 0, 0).toISOString() })
    expect(suggestEventDate(task)).toEqual({ label: 'Mon', tokenText: 'monday' })
  })

  it('zero-pads single-digit hours and minutes', () => {
    const task = makeTask({ eventDate: new Date(2026, 0, 7, 9, 5).toISOString() }) // Wed
    expect(suggestEventDate(task)).toEqual({ label: 'Wed 09:05', tokenText: 'wednesday 09:05' })
  })
})

describe('suggestEventDates', () => {
  it('collects one suggestion per similar task, in order', () => {
    const tasks = [
      makeTask({ eventDate: new Date(2026, 0, 9, 16, 0).toISOString() }), // Fri 16:00
      makeTask({ eventDate: new Date(2026, 0, 7, 8, 0).toISOString() }), // Wed 08:00
      makeTask({ eventDate: new Date(2026, 0, 5, 7, 0).toISOString() }), // Mon 07:00
    ]
    expect(suggestEventDates(tasks)).toEqual([
      { label: 'Fri 16:00', tokenText: 'friday 16:00' },
      { label: 'Wed 08:00', tokenText: 'wednesday 08:00' },
      { label: 'Mon 07:00', tokenText: 'monday 07:00' },
    ])
  })

  it('removes duplicate weekday+time combinations', () => {
    const tasks = [
      makeTask({ eventDate: new Date(2026, 0, 5, 7, 0).toISOString() }), // Mon 07:00
      makeTask({ eventDate: new Date(2026, 0, 12, 7, 0).toISOString() }), // also Mon 07:00
      makeTask({ eventDate: new Date(2026, 0, 7, 8, 0).toISOString() }), // Wed 08:00
    ]
    expect(suggestEventDates(tasks)).toEqual([
      { label: 'Mon 07:00', tokenText: 'monday 07:00' },
      { label: 'Wed 08:00', tokenText: 'wednesday 08:00' },
    ])
  })

  it('skips tasks with no event date', () => {
    const tasks = [makeTask({ eventDate: null }), makeTask({ eventDate: new Date(2026, 0, 5, 7, 0).toISOString() })]
    expect(suggestEventDates(tasks)).toEqual([{ label: 'Mon 07:00', tokenText: 'monday 07:00' }])
  })

  it('caps at 3 by default', () => {
    const days = [5, 6, 7, 8].map(day => new Date(2026, 0, day, 7, 0).toISOString())
    const tasks = days.map(eventDate => makeTask({ eventDate }))
    expect(suggestEventDates(tasks)).toHaveLength(3)
  })

  it('honors a custom max', () => {
    const tasks = [
      makeTask({ eventDate: new Date(2026, 0, 5, 7, 0).toISOString() }),
      makeTask({ eventDate: new Date(2026, 0, 7, 8, 0).toISOString() }),
    ]
    expect(suggestEventDates(tasks, 1)).toHaveLength(1)
  })
})

describe('formatDurationToken', () => {
  it('minutes only', () => expect(formatDurationToken(1800)).toBe('30m'))
  it('hours only', () => expect(formatDurationToken(7200)).toBe('2h'))
  it('hours and minutes with no space, matching the duration parser token format', () => {
    expect(formatDurationToken(5400)).toBe('1h30m')
  })
})

// Wednesday 10 Jun 2026 10:00 local — same reference point used by taskInputParser.test.ts
const WED = new Date('2026-06-10T10:00:00')

describe('suggested tokens round-trip through the raw-text parser', () => {
  it('a duration token applies as the exact suggested duration', () => {
    const suggested = suggestDurations([makeTask({ duration: 5400 })])[0]
    const r = parse(`Workout ${formatDurationToken(suggested)}`, WED)
    expect(r.duration?.value).toBe(5400)
  })

  it('an event-date token resolves to the next occurrence of that weekday, not the same one', () => {
    const reference = makeTask({ eventDate: new Date(2026, 5, 8, 12, 0).toISOString() }) // Mon Jun 8 2026, 12:00 — already in the past relative to WED
    const suggestion = suggestEventDates([reference])[0]
    const r = parse(`Workout ${suggestion.tokenText}`, WED)
    const d = new Date(r.eventDate!.value)
    expect(d.getDay()).toBe(1) // Monday
    expect({ y: d.getFullYear(), mo: d.getMonth(), day: d.getDate(), h: d.getHours(), m: d.getMinutes() })
      .toEqual({ y: 2026, mo: 5, day: 15, h: 12, m: 0 }) // next Monday after WED (Jun 10), not the original Jun 8
  })

  it('a date-only event-date token (no time-of-day) resolves without a time', () => {
    const reference = makeTask({ eventDate: new Date(2026, 5, 8, 0, 0).toISOString() })
    const suggestion = suggestEventDates([reference])[0]
    const r = parse(`Workout ${suggestion.tokenText}`, WED)
    const d = new Date(r.eventDate!.value)
    expect({ h: d.getHours(), m: d.getMinutes() }).toEqual({ h: 0, m: 0 })
  })
})
