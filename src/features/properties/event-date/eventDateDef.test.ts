import { describe, expect, it } from 'vitest'
import { formatEventDate, formatEventDateShort } from './eventDateDef'

// Built in local time so assertions are timezone-safe.
const iso = (y: number, mo: number, d: number, h = 0, m = 0) => new Date(y, mo, d, h, m).toISOString()

describe('formatEventDate', () => {
  it('omits time at midnight', () => expect(formatEventDate(iso(2026, 5, 10))).toBe('Wed, Jun 10'))
  it('includes time when present', () => expect(formatEventDate(iso(2026, 5, 10, 17, 0))).toBe('Wed, Jun 10, 5:00 PM'))
})

describe('formatEventDateShort', () => {
  const now = new Date(2026, 5, 10, 8, 0) // Wed, Jun 10 2026
  it('delegates to the shared relative date label', () =>
    expect(formatEventDateShort(iso(2026, 5, 11, 9, 5), now)).toBe('Tomorrow, 09:05'))
  it('falls back to day + short month beyond the week window', () =>
    expect(formatEventDateShort(iso(2026, 5, 20), now)).toBe('20 Jun'))
})
