import { describe, expect, it } from 'vitest'
import { formatDuration } from './duration'

describe('formatDuration', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00')
  })

  it('formats seconds only (no minutes)', () => {
    expect(formatDuration(30)).toBe('00:30')
  })

  it('formats exactly one minute', () => {
    expect(formatDuration(60)).toBe('01:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('01:30')
  })

  it('zero-pads both parts when below 10', () => {
    expect(formatDuration(65)).toBe('01:05')
  })

  it('formats up to 59:59 without hours', () => {
    expect(formatDuration(3599)).toBe('59:59')
  })

  it('switches to HH:MM:SS at exactly one hour', () => {
    expect(formatDuration(3600)).toBe('01:00:00')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatDuration(3661)).toBe('01:01:01')
  })

  it('formats 1.5 hours', () => {
    expect(formatDuration(5400)).toBe('01:30:00')
  })

  it('zero-pads a lone second in the hours form', () => {
    expect(formatDuration(3601)).toBe('01:00:01')
  })

  it('formats double-digit hours', () => {
    expect(formatDuration(36000)).toBe('10:00:00')
  })
})
