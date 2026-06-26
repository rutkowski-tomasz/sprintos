import { describe, expect, it } from 'vitest'
import { formatDuration, formatDurationClock } from './durationDef'

describe('formatDuration', () => {
  it('minutes only', () => expect(formatDuration(1800)).toBe('30m'))
  it('hours only', () => expect(formatDuration(7200)).toBe('2h'))
  it('hours and minutes', () => expect(formatDuration(5400)).toBe('1h 30m'))
  it('drops trailing seconds', () => expect(formatDuration(5430)).toBe('1h 30m'))
})

describe('formatDurationClock', () => {
  it('under an hour is MM:SS', () => expect(formatDurationClock(1830)).toBe('30:30'))
  it('over an hour is HH:MM:SS', () => expect(formatDurationClock(5430)).toBe('01:30:30'))
  it('zero-pads each field', () => expect(formatDurationClock(3661)).toBe('01:01:01'))
})
