import { describe, expect, it } from 'vitest'
import { formatEventDate, formatEventDateShort } from './eventDateDef'

// Built in local time so assertions are timezone-safe.
const iso = (y: number, mo: number, d: number, h = 0, m = 0) => new Date(y, mo, d, h, m).toISOString()

describe('formatEventDate', () => {
  it('omits time at midnight', () => expect(formatEventDate(iso(2026, 5, 10))).toBe('Wed, Jun 10'))
  it('includes time when present', () => expect(formatEventDate(iso(2026, 5, 10, 17, 0))).toBe('Wed, Jun 10, 5:00 PM'))
})

describe('formatEventDateShort', () => {
  it('day and short month at midnight', () => expect(formatEventDateShort(iso(2026, 5, 10))).toBe('10 Jun'))
  it('appends zero-padded 24h time', () => expect(formatEventDateShort(iso(2026, 5, 10, 9, 5))).toBe('10 Jun 09:05'))
})
