import { describe, expect, it } from 'vitest'
import { formatSnooze } from './snoozeDef'

// now = Monday, Jun 8 2026; iso builds a local date so assertions are timezone-safe.
const now = new Date(2026, 5, 8, 9, 0)
const iso = (day: number, h = 0, m = 0) => new Date(2026, 5, day, h, m).toISOString()

describe('formatSnooze', () => {
  it('renders an absolute offset in days', () => expect(formatSnooze('-172800', now)).toBe('−2d'))
  it('renders an absolute offset in hours', () => expect(formatSnooze('-3600', now)).toBe('−1h'))
  it('renders an absolute offset in seconds', () => expect(formatSnooze('-90', now)).toBe('−90s'))

  it('delegates ISO dates to the shared relative date label', () =>
    expect(formatSnooze(iso(9, 8, 0), now)).toBe('@Tomorrow, 08:00'))
  it('falls back to day + short month beyond the week window', () =>
    expect(formatSnooze(iso(20), now)).toBe('@20 Jun, Saturday'))
})
