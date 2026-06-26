import { TaskStatus } from '@/types'

export interface Span {
  start: number
  end: number
  value: string
}

export interface ParseResult {
  title: string
  emoji: (Span & { value: string }) | null
  eventDate: (Omit<Span, 'value'> & { value: string }) | null
  duration: (Omit<Span, 'value'> & { value: number }) | null
  status: (Omit<Span, 'value'> & { value: number }) | null
  goalId: (Omit<Span, 'value'> & { value: string }) | null
  sourceUrl: (Omit<Span, 'value'> & { value: string }) | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

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

const STATUS_MAP: Record<string, number> = {
  todo: TaskStatus.TODO,
  next: TaskStatus.NEXT,
  progress: TaskStatus.IN_PROGRESS,
  done: TaskStatus.DONE,
  archive: TaskStatus.ARCHIVED,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface Token {
  text: string
  start: number
  end: number
}

function tokenise(input: string): Token[] {
  const tokens: Token[] = []
  const re = /\S+/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    tokens.push({ text: m[0], start: m.index, end: m.index + m[0].length })
  }
  return tokens
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

const TIME_RE2 = /^(\d{1,2})[:.](\d{2})$/

function parseTime(text: string): { h: number; m: number } | null {
  const m = TIME_RE2.exec(text)
  if (m) {
    const h = parseInt(m[1]), min = parseInt(m[2])
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { h, m: min }
  }
  return null
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

// ─── Emoji ───────────────────────────────────────────────────────────────────

// Matches emoji_presentation emojis AND text-default emojis made emoji by U+FE0F
const EMOJI_START = /^(?:\p{Emoji_Presentation}|\p{Emoji}️)/u
const EMOJI_CONT = /^(?:️|⃣|‍\p{Emoji}|\p{Emoji_Modifier}|\p{Emoji_Presentation})/u

function extractEmoji(tokens: Token[]): { idx: number; value: string; start: number; end: number } | null {
  for (let i = 0; i < tokens.length; i++) {
    const text = tokens[i].text
    if (!EMOJI_START.test(text)) continue
    // grab whole grapheme cluster: walk char by char collecting continuation chars
    let pos = 0
    // consume first codepoint(s) that form the start
    const startM = EMOJI_START.exec(text)
    if (!startM) continue
    pos = startM[0].length
    while (pos < text.length) {
      const sub = text.slice(pos)
      const cm = EMOJI_CONT.exec(sub)
      if (!cm) break
      pos += cm[0].length
    }
    const value = text.slice(0, pos)
    return { idx: i, value, start: tokens[i].start, end: tokens[i].start + pos }
  }
  return null
}

// ─── URL ─────────────────────────────────────────────────────────────────────

function consumeUrls(tokens: Token[], consumed: Set<number>): string | null {
  let first: string | null = null
  for (let i = 0; i < tokens.length; i++) {
    if (consumed.has(i)) continue
    if (/^https?:\/\//i.test(tokens[i].text)) {
      if (first === null) first = tokens[i].text
      consumed.add(i)
    }
  }
  return first
}

// ─── Duration ────────────────────────────────────────────────────────────────

const DURATION_RE = /^(\d+(?:\.\d+)?h)?(\d+m)?$/i

function extractDuration(tokens: Token[]): { idx: number; value: number; start: number; end: number } | null {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const m = DURATION_RE.exec(t.text)
    if (m && (m[1] || m[2]) && t.text.length > 1) {
      const hPart = m[1] ? parseFloat(m[1]) : 0
      const mPart = m[2] ? parseInt(m[2]) : 0
      const secs = Math.round(hPart * 3600) + mPart * 60
      if (secs > 0) return { idx: i, value: secs, start: t.start, end: t.end }
    }
  }
  return null
}

// ─── Status ──────────────────────────────────────────────────────────────────

function extractStatus(tokens: Token[]): { idx: number; idxEnd: number; value: number; start: number; end: number } | null {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].text.toLowerCase() === 'in' && tokens[i + 1].text.toLowerCase() === 'progress') {
      return { idx: i, idxEnd: i + 1, value: TaskStatus.IN_PROGRESS, start: tokens[i].start, end: tokens[i + 1].end }
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const key = tokens[i].text.toLowerCase()
    if (key in STATUS_MAP && (i === 0 || i === tokens.length - 1)) {
      return { idx: i, idxEnd: i, value: STATUS_MAP[key], start: tokens[i].start, end: tokens[i].end }
    }
  }
  return null
}

// ─── Date ────────────────────────────────────────────────────────────────────

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
          let y = bumpYearIfPast(now.getFullYear(), mo, day, now)
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
          let y = bumpYearIfPast(now.getFullYear(), mo, day, now)
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
        let y = bumpYearIfPast(now.getFullYear(), mo, day, now)
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
        let y = bumpYearIfPast(now.getFullYear(), mo, day, now)
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

// ─── Parse ───────────────────────────────────────────────────────────────────

export function parse(
  input: string,
  now: Date,
  goalId?: string,
  goalName?: string,
): ParseResult {
  const tokens = tokenise(input)
  const consumed = new Set<number>()

  // 1. Emoji (first one wins)
  let emojiResult: ParseResult['emoji'] = null
  const emojiFound = extractEmoji(tokens)
  if (emojiFound) {
    emojiResult = { value: emojiFound.value, start: emojiFound.start, end: emojiFound.end }
    consumed.add(emojiFound.idx)
  }

  // 2. URLs (all consumed; first becomes sourceUrl)
  let urlResult: ParseResult['sourceUrl'] = null
  const firstUrl = consumeUrls(tokens, consumed)
  if (firstUrl !== null) {
    // find character positions of first URL
    const urlTok = tokens.find(t => t.text === firstUrl)!
    urlResult = { value: firstUrl, start: urlTok.start, end: urlTok.end }
  }

  // 3. Goal (#tag)
  let goalResult: ParseResult['goalId'] = null
  for (let i = 0; i < tokens.length; i++) {
    if (consumed.has(i) || !tokens[i].text.startsWith('#')) continue
    if (!goalId || !goalName) break // no goal context — keep # in title
    const hashFirst = tokens[i].text.slice(1)
    const goalWords = goalName.split(' ')
    if (hashFirst !== goalWords[0]) { consumed.add(i); break }
    // Try to match all goal words
    let match = true
    let endI = i
    for (let g = 1; g < goalWords.length; g++) {
      const next = tokens[i + g]
      if (next && !consumed.has(i + g) && next.text === goalWords[g]) {
        endI = i + g
      } else {
        match = false
        // partial match: consume tokens up to how many we have
        // consume as many tokens as goalName has words (partial drop)
        endI = Math.min(i + goalWords.length - 1, tokens.length - 1)
        break
      }
    }
    if (match) {
      goalResult = { value: goalId, start: tokens[i].start, end: tokens[endI].end }
    }
    for (let g = i; g <= endI; g++) consumed.add(g)
    break
  }

  // 4. Duration
  let durationResult: ParseResult['duration'] = null
  const rem1 = tokens.map((t, i) => ({ t, i })).filter(x => !consumed.has(x.i))
  const durFound = extractDuration(rem1.map(x => x.t))
  if (durFound) {
    consumed.add(rem1[durFound.idx].i)
    durationResult = { value: durFound.value, start: durFound.start, end: durFound.end }
  }

  // 5. Date
  let dateResult: ParseResult['eventDate'] = null
  const rem2 = tokens.map((t, i) => ({ t, i })).filter(x => !consumed.has(x.i))
  const dateFound = extractDate(rem2.map(x => x.t), now)
  if (dateFound) {
    for (let ri = dateFound.idxStart; ri <= dateFound.idxEnd; ri++) consumed.add(rem2[ri].i)
    dateResult = { value: dateFound.value, start: dateFound.start, end: dateFound.end }
  }

  // 6. Status
  let statusResult: ParseResult['status'] = null
  const rem3 = tokens.map((t, i) => ({ t, i })).filter(x => !consumed.has(x.i))
  const statusFound = extractStatus(rem3.map(x => x.t))
  if (statusFound) {
    for (let si = statusFound.idx; si <= statusFound.idxEnd; si++) consumed.add(rem3[si].i)
    statusResult = { value: statusFound.value, start: statusFound.start, end: statusFound.end }
  }

  // 7. Title = remaining tokens joined
  const title = tokens.filter((_, i) => !consumed.has(i)).map(t => t.text).join(' ').trim()

  return { title, emoji: emojiResult, eventDate: dateResult, duration: durationResult, status: statusResult, goalId: goalResult, sourceUrl: urlResult }
}
