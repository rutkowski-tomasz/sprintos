import type { ParseHit, PropertyParser, ParseContext, Token } from '../parser'
import { dayDiff, formatDateLabel } from '@/lib/dateLabel'
import { SPRINT_LABEL_COLOR } from '../sprint/sprintDef'

const EVENT_DATE_HUE = 27
const EVENT_DATE_LIGHTNESS = 61

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

// Level 1 (today or past): full saturation. Level 2 (tomorrow): muted. Level 3 (2+ days out): future-sprint gray.
export const EVENT_DATE_COLOR = hslToHex(EVENT_DATE_HUE, 96, EVENT_DATE_LIGHTNESS)
export const EVENT_DATE_COLOR_TOMORROW = hslToHex(EVENT_DATE_HUE, 55, EVENT_DATE_LIGHTNESS)
export const EVENT_DATE_COLOR_LATER = SPRINT_LABEL_COLOR.future

export function eventDateColor(date: Date, now: Date): string {
  const diff = dayDiff(date, now)
  if (diff <= 0) return EVENT_DATE_COLOR
  if (diff === 1) return EVENT_DATE_COLOR_TOMORROW
  return EVENT_DATE_COLOR_LATER
}

export function formatEventDate(iso: string): string {
  const d = new Date(iso)
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
  if (d.getHours() || d.getMinutes()) {
    opts.hour = 'numeric'
    opts.minute = '2-digit'
  }
  return d.toLocaleDateString('en-US', opts)
}

export function formatEventDateShort(iso: string, now: Date): string {
  return formatDateLabel(new Date(iso), now)
}

export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─── Parsing ───────────────────────────────────────────────────────────────

const DAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

const MONTHS: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
}

const TIME_RE2 = /^(\d{1,2})[:.](\d{2})$/

function parseTime(text: string): { h: number; m: number } | null {
  const m = TIME_RE2.exec(text)
  if (m) {
    const h = parseInt(m[1]), min = parseInt(m[2])
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { h, m: min }
  }
  return null
}

function nextWeekday(from: Date, target: number): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const diff = ((target - d.getDay()) + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d
}

function makeDateISO(y: number, mo: number, day: number, h: number, m: number): string {
  return new Date(y, mo, day, h, m, 0, 0).toISOString()
}

function bumpYearIfPast(y: number, mo: number, day: number, now: Date): number {
  if (new Date(y, mo, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return y + 1
  return y
}

function validOrdinalSuffix(n: number, suffix: string): boolean {
  const s = suffix.toLowerCase()
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return s === 'th'
  switch (n % 10) {
    case 1: return s === 'st'
    case 2: return s === 'nd'
    case 3: return s === 'rd'
    default: return s === 'th'
  }
}

function extractDate(tokens: Token[], now: Date): { idxStart: number; idxEnd: number; value: string; start: number; end: number } | null {
  const n = tokens.length

  for (let i = 0; i < n; i++) {
    const t = tokens[i].text.toLowerCase()

    // today / tomorrow / tmrw
    if (t === 'today' || t === 'tomorrow' || t === 'tmrw') {
      const base = new Date(now)
      base.setHours(0, 0, 0, 0)
      if (t !== 'today') base.setDate(base.getDate() + 1)
      let h = 0, m = 0, idxEnd = i, end = tokens[i].end
      if (i + 1 < n) {
        const time = parseTime(tokens[i + 1].text)
        if (time) { h = time.h; m = time.m; idxEnd = i + 1; end = tokens[i + 1].end }
      }
      base.setHours(h, m, 0, 0)
      return { idxStart: i, idxEnd, value: base.toISOString(), start: tokens[i].start, end }
    }

    // Day of week
    if (t in DAYS) {
      const base = nextWeekday(now, DAYS[t])
      let h = 0, m = 0, idxEnd = i, end = tokens[i].end
      if (i + 1 < n) {
        const next = tokens[i + 1]
        const time = parseTime(next.text)
        if (time) {
          h = time.h; m = time.m; idxEnd = i + 1; end = next.end
        } else if (/^\d{1,2}$/.test(next.text) && next.start === tokens[i].end + 1) {
          // bare hour directly adjacent
          const bh = parseInt(next.text)
          if (bh >= 0 && bh <= 23) { h = bh; idxEnd = i + 1; end = next.end }
        }
      }
      base.setHours(h, m, 0, 0)
      return { idxStart: i, idxEnd, value: base.toISOString(), start: tokens[i].start, end }
    }

    // Ordinal NNst/nd/rd/th + Month (valid suffix required when number precedes month)
    const ordM = /^(\d{1,2})(st|nd|rd|th)$/i.exec(tokens[i].text)
    if (ordM) {
      const day = parseInt(ordM[1])
      if (validOrdinalSuffix(day, ordM[2]) && i + 1 < n) {
        const mk = tokens[i + 1].text.toLowerCase()
        if (mk in MONTHS) {
          const mo = MONTHS[mk]
          const y = bumpYearIfPast(now.getFullYear(), mo, day, now)
          let h = 0, m2 = 0, idxEnd = i + 1, end = tokens[i + 1].end
          if (i + 2 < n) {
            const time = parseTime(tokens[i + 2].text)
            if (time) { h = time.h; m2 = time.m; idxEnd = i + 2; end = tokens[i + 2].end }
          }
          return { idxStart: i, idxEnd, value: makeDateISO(y, mo, day, h, m2), start: tokens[i].start, end }
        }
      }
      continue
    }

    // Month + number/ordinal (any ordinal suffix tolerated when month first)
    if (t in MONTHS) {
      const mo = MONTHS[t]
      if (i + 1 < n) {
        const nextText = tokens[i + 1].text
        const numM = /^(\d{1,2})(st|nd|rd|th)?$/i.exec(nextText)
        if (numM) {
          const day = parseInt(numM[1])
          const y = bumpYearIfPast(now.getFullYear(), mo, day, now)
          let h = 0, m2 = 0, idxEnd = i + 1, end = tokens[i + 1].end
          if (i + 2 < n) {
            const time = parseTime(tokens[i + 2].text)
            if (time) { h = time.h; m2 = time.m; idxEnd = i + 2; end = tokens[i + 2].end }
          }
          return { idxStart: i, idxEnd, value: makeDateISO(y, mo, day, h, m2), start: tokens[i].start, end }
        }
        // next token is not a day number; skip the time too if present to avoid bare-time parse
        if (parseTime(nextText) !== null) i++
      }
      continue
    }

    // Bare number + month (N Jun)
    if (/^\d{1,2}$/.test(tokens[i].text) && i + 1 < n) {
      const mk = tokens[i + 1].text.toLowerCase()
      if (mk in MONTHS) {
        const day = parseInt(tokens[i].text)
        const mo = MONTHS[mk]
        const y = bumpYearIfPast(now.getFullYear(), mo, day, now)
        let h = 0, m2 = 0, idxEnd = i + 1, end = tokens[i + 1].end
        if (i + 2 < n) {
          const time = parseTime(tokens[i + 2].text)
          if (time) { h = time.h; m2 = time.m; idxEnd = i + 2; end = tokens[i + 2].end }
        }
        return { idxStart: i, idxEnd, value: makeDateISO(y, mo, day, h, m2), start: tokens[i].start, end }
      }
    }

    // DD.MM (01.06)
    const ddmmM = /^(\d{2})\.(\d{2})$/.exec(tokens[i].text)
    if (ddmmM) {
      const day = parseInt(ddmmM[1]), mo = parseInt(ddmmM[2]) - 1
      if (mo >= 0 && mo <= 11 && day >= 1 && day <= 31) {
        const y = bumpYearIfPast(now.getFullYear(), mo, day, now)
        let h = 0, m2 = 0, idxEnd = i, end = tokens[i].end
        if (i + 1 < n) {
          const time = parseTime(tokens[i + 1].text)
          if (time) { h = time.h; m2 = time.m; idxEnd = i + 1; end = tokens[i + 1].end }
        }
        return { idxStart: i, idxEnd, value: makeDateISO(y, mo, day, h, m2), start: tokens[i].start, end }
      }
    }

    // Bare time HH:MM or HH.MM
    const time = parseTime(tokens[i].text)
    if (time) {
      const base = new Date(now)
      base.setSeconds(0, 0)
      const candidate = new Date(base)
      candidate.setHours(time.h, time.m, 0, 0)
      if (candidate > now) {
        base.setHours(time.h, time.m, 0, 0)
      } else {
        base.setDate(base.getDate() + 1)
        base.setHours(time.h, time.m, 0, 0)
      }
      return { idxStart: i, idxEnd: i, value: base.toISOString(), start: tokens[i].start, end: tokens[i].end }
    }
  }

  return null
}

export const dateParser: PropertyParser = {
  key: 'eventDate',
  parse(tokens: Token[], { now }: ParseContext): ParseHit | null {
    const found = extractDate(tokens, now)
    if (!found) return null
    const consume: number[] = []
    for (let i = found.idxStart; i <= found.idxEnd; i++) consume.push(i)
    return { consume, start: found.start, end: found.end, value: found.value }
  },
}
