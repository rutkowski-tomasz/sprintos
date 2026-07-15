import { describe, expect, it } from 'vitest'
import { formatDuration } from './durationDef'

describe('formatDuration', () => {
  it('minutes only', () => expect(formatDuration(1800)).toBe('30m'))
  it('hours only', () => expect(formatDuration(7200)).toBe('2h'))
  it('hours and minutes', () => expect(formatDuration(5400)).toBe('1h30m'))
  it('drops trailing seconds', () => expect(formatDuration(5430)).toBe('1h30m'))
})
