import { describe, expect, it } from 'vitest'
import { formatDateLabel } from './dateLabel'

// now = Monday, Jun 8 2026; d builds a local date so assertions are timezone-safe.
const now = new Date(2026, 5, 8, 9, 0)
const d = (day: number, h = 0, m = 0) => new Date(2026, 5, day, h, m)

describe('formatDateLabel', () => {
  it('labels the same day as Today', () => expect(formatDateLabel(d(8), now)).toBe('Today'))
  it('includes time for Today when set', () => expect(formatDateLabel(d(8, 9, 30), now)).toBe('Today, 09:30'))

  it('labels the next day as Tomorrow', () => expect(formatDateLabel(d(9), now)).toBe('Tomorrow'))
  it('includes time for Tomorrow when set', () => expect(formatDateLabel(d(9, 12, 0), now)).toBe('Tomorrow, 12:00'))

  it('labels 2-6 days out with the weekday name', () => expect(formatDateLabel(d(10), now)).toBe('Wednesday'))
  it('includes time for a weekday label when set', () => expect(formatDateLabel(d(10, 14, 5), now)).toBe('Wednesday, 14:05'))
  it('still uses the weekday name 6 days out', () => expect(formatDateLabel(d(14), now)).toBe('Sunday'))

  it('falls back to day + short month 7 days out', () => expect(formatDateLabel(d(15), now)).toBe('15 Jun'))
  it('falls back to day + short month further out', () => {
    const farFriday = new Date(2026, 5, 5, 9, 0)
    expect(formatDateLabel(new Date(2026, 7, 1, 16, 30), farFriday)).toBe('1 Aug, 16:30')
  })

  it('falls back to day + short month for past dates', () => expect(formatDateLabel(d(1), now)).toBe('1 Jun'))
})
