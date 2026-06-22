import { describe, expect, it } from 'vitest'
import { formatDuration, parseDuration } from './formatters'

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

describe('parseDuration', () => {
  it('returns null for empty string', () => {
    expect(parseDuration('')).toBeNull()
  })

  it('returns null for whitespace only', () => {
    expect(parseDuration('   ')).toBeNull()
  })

  it('returns null for letters', () => {
    expect(parseDuration('abc')).toBeNull()
  })

  it('returns null for natural-language format', () => {
    expect(parseDuration('1h30m')).toBeNull()
  })

  it('returns null for decimal', () => {
    expect(parseDuration('1.5')).toBeNull()
  })

  it('returns null for letters mixed with digits', () => {
    expect(parseDuration('1a:20')).toBeNull()
  })

  describe('bare seconds (no colons)', () => {
    it('treats a bare number as seconds', () => {
      expect(parseDuration('60')).toBe(60)
    })

    it('parses 600 as 600 seconds (10 minutes)', () => {
      expect(parseDuration('600')).toBe(600)
    })

    it('parses 3600 as 3600 seconds (1 hour)', () => {
      expect(parseDuration('3600')).toBe(3600)
    })

    it('parses 0', () => {
      expect(parseDuration('0')).toBe(0)
    })
  })

  describe('MM:SS format', () => {
    it('parses M:SS', () => {
      expect(parseDuration('1:20')).toBe(80)
    })

    it('parses MM:SS', () => {
      expect(parseDuration('10:30')).toBe(630)
    })

    it('parses 01:20 (left-padded)', () => {
      expect(parseDuration('01:20')).toBe(80)
    })

    it('parses 0 minutes', () => {
      expect(parseDuration('0:30')).toBe(30)
    })

    it('parses 1:00 as exactly one minute', () => {
      expect(parseDuration('1:00')).toBe(60)
    })

    it('returns null when seconds are 60 or more', () => {
      expect(parseDuration('1:60')).toBeNull()
      expect(parseDuration('0:99')).toBeNull()
    })

    it('returns null for trailing colon', () => {
      expect(parseDuration('1:')).toBeNull()
    })

    it('returns null for leading colon', () => {
      expect(parseDuration(':20')).toBeNull()
    })
  })

  describe('HH:MM:SS format', () => {
    it('parses H:MM:SS', () => {
      expect(parseDuration('1:00:00')).toBe(3600)
    })

    it('parses HH:MM:SS', () => {
      expect(parseDuration('01:30:00')).toBe(5400)
    })

    it('parses with all parts non-zero', () => {
      expect(parseDuration('1:01:01')).toBe(3661)
    })

    it('round-trips with formatDuration', () => {
      expect(parseDuration(formatDuration(5400))).toBe(5400)
      expect(parseDuration(formatDuration(3661))).toBe(3661)
      expect(parseDuration(formatDuration(90))).toBe(90)
    })

    it('returns null when minutes are 60 or more', () => {
      expect(parseDuration('1:60:00')).toBeNull()
    })

    it('returns null when seconds are 60 or more', () => {
      expect(parseDuration('1:00:60')).toBeNull()
    })

    it('returns null for consecutive colons', () => {
      expect(parseDuration('1::00')).toBeNull()
    })
  })

  it('returns null for more than three colon-separated parts', () => {
    expect(parseDuration('1:00:00:00')).toBeNull()
  })
})
