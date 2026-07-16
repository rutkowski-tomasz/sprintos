import { describe, expect, it } from 'vitest'
import { TaskStatus } from '@/types'
import { parse } from './taskInputParser'

/** Returns the raw substring of input covered by a span */
function raw(span: { start: number; end: number } | null, input: string): string | null {
  return span ? input.slice(span.start, span.end) : null
}

/** Extracts local date components for timezone-safe assertions */
function local(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  return { y: d.getFullYear(), mo: d.getMonth(), day: d.getDate(), h: d.getHours(), m: d.getMinutes() }
}

// Wednesday 10 Jun 2026 10:00 local — primary reference point
const WED = new Date('2026-06-10T10:00:00')

describe('parse', () => {
  // ─── Emoji ──────────────────────────────────────────────────────────────────

  describe('emoji', () => {
    it('E1: leading multi-codepoint emoji', () => {
      const input = '🏋️ Workout'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('🏋️')
      expect(raw(r.emoji, input)).toBe('🏋️')
      expect(r.title).toBe('Workout')
    })

    it('E2: trailing emoji', () => {
      const input = 'Workout 🏋️'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('🏋️')
      expect(raw(r.emoji, input)).toBe('🏋️')
      expect(r.title).toBe('Workout')
    })

    it('E3: mid-string emoji', () => {
      const input = 'Buy 🛒 groceries'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('🛒')
      expect(raw(r.emoji, input)).toBe('🛒')
      expect(r.title).toBe('Buy groceries')
    })

    it('E4: no emoji', () => {
      const r = parse('Take out the trash', WED)
      expect(r.emoji).toBeNull()
      expect(r.title).toBe('Take out the trash')
    })

    it('E5: multiple emojis — first wins, second stays in title', () => {
      const input = '🏋️ Workout 🔥'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('🏋️')
      expect(r.title).toBe('Workout 🔥')
    })

    it('E6: emoji variant — colored emoji', () => {
      const input = '💪🏻 Workout'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('💪🏻')
    })

    it('E7: leading emoji with no whitespace', () => {
      const input = '👥Meetup'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('👥')
      expect(raw(r.emoji, input)).toBe('👥')
      expect(r.title).toBe('Meetup')
    })

    it('E8: trailing emoji with no whitespace', () => {
      const input = 'Meetup👥'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('👥')
      expect(raw(r.emoji, input)).toBe('👥')
      expect(r.title).toBe('Meetup')
    })

    it('E9: mid-word emoji with no whitespace on either side', () => {
      const input = 'Friends👥meetup'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('👥')
      expect(raw(r.emoji, input)).toBe('👥')
      expect(r.title).toBe('Friends meetup')
    })
  })

  // ─── Event date ─────────────────────────────────────────────────────────────

  describe('eventDate', () => {
    it('D1: day of week only — next Monday from Wednesday', () => {
      const input = 'Clean car Monday'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 0, m: 0 })
      expect(raw(r.eventDate, input)).toBe('Monday')
      expect(r.title).toBe('Clean car')
    })

    it('D2: day of week with time', () => {
      const input = 'Workout Monday 17:00'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 17, m: 0 })
      expect(raw(r.eventDate, input)).toBe('Monday 17:00')
      expect(r.title).toBe('Workout')
    })

    it('D3: day abbreviation with time', () => {
      const input = 'Call John Tue 13:12'
      const r = parse(input, WED) // next Tue after Wed Jun 10 = Jun 16
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 16, h: 13, m: 12 })
      expect(raw(r.eventDate, input)).toBe('Tue 13:12')
      expect(r.title).toBe('Call John')
    })

    it('D4: ordinal date', () => {
      const input = 'Submit report 3rd June'
      const r = parse(input, new Date('2026-06-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 3, h: 0, m: 0 })
      expect(raw(r.eventDate, input)).toBe('3rd June')
      expect(r.title).toBe('Submit report')
    })

    it('D5: ordinal date with time', () => {
      const input = 'Flight 1st Apr 06:30'
      const r = parse(input, new Date('2026-03-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 3, day: 1, h: 6, m: 30 })
      expect(raw(r.eventDate, input)).toBe('1st Apr 06:30')
      expect(r.title).toBe('Flight')
    })

    it('D6: DD.MM format with time', () => {
      const input = 'Meeting 01.06 12:00'
      const r = parse(input, new Date('2026-05-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 1, h: 12, m: 0 })
      expect(raw(r.eventDate, input)).toBe('01.06 12:00')
      expect(r.title).toBe('Meeting')
    })

    it('D7: relative today', () => {
      const input = 'Buy milk today'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 10, h: 0, m: 0 })
      expect(raw(r.eventDate, input)).toBe('today')
      expect(r.title).toBe('Buy milk')
    })

    it('D8: today with time', () => {
      const input = 'Call today 12:00'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 10, h: 12, m: 0 })
      expect(raw(r.eventDate, input)).toBe('today 12:00')
      expect(r.title).toBe('Call')
    })

    it('D9: tmrw', () => {
      const input = 'Review PR tmrw'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 11, h: 0, m: 0 })
      expect(raw(r.eventDate, input)).toBe('tmrw')
      expect(r.title).toBe('Review PR')
    })

    it('D10: tomorrow with time', () => {
      const input = 'Dentist tomorrow 18:19'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 11, h: 18, m: 19 })
      expect(raw(r.eventDate, input)).toBe('tomorrow 18:19')
      expect(r.title).toBe('Dentist')
    })

    it('D11: bare single-digit hour after day word', () => {
      const input = 'Standup Monday 9'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 9, m: 0 })
      expect(raw(r.eventDate, input)).toBe('Monday 9')
      expect(r.title).toBe('Standup')
    })

    it('D12: number after intervening word — not consumed as time', () => {
      const input = 'Buy Monday groceries 3'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 0, m: 0 })
      expect(raw(r.eventDate, input)).toBe('Monday')
      expect(r.title).toBe('Buy groceries 3')
    })

    it('D13: date in the middle of title fragments', () => {
      const input = 'Workout Monday 17:00 leg/fullbody'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 17, m: 0 })
      expect(raw(r.eventDate, input)).toBe('Monday 17:00')
      expect(r.title).toBe('Workout leg/fullbody')
    })

    it('D14: bare time, future today', () => {
      const input = 'Call 17:00'
      const r = parse(input, WED) // now=10:00, 17:00 is future → today
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 10, h: 17, m: 0 })
      expect(raw(r.eventDate, input)).toBe('17:00')
      expect(r.title).toBe('Call')
    })

    it('D15: bare time, past today → tomorrow', () => {
      const input = 'Call 08:00'
      const r = parse(input, WED) // now=10:00, 08:00 already passed → tomorrow
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 11, h: 8, m: 0 })
      expect(r.title).toBe('Call')
    })

    it('D16: bare time exactly now → tomorrow', () => {
      const input = 'Call 10:00'
      const r = parse(input, WED) // not strictly in the future → tomorrow
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 11, h: 10, m: 0 })
      expect(r.title).toBe('Call')
    })

    it('D17: bare time one minute in the future → today', () => {
      const input = 'Call 10:01'
      const r = parse(input, WED) // strictly future → today
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 10, h: 10, m: 1 })
      expect(r.title).toBe('Call')
    })

    it('D18: bare time dot separator, future today', () => {
      const input = 'Workout 17.00'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 10, h: 17, m: 0 })
      expect(raw(r.eventDate, input)).toBe('17.00')
      expect(r.title).toBe('Workout')
    })

    it('D19: bare time dot separator, past today → tomorrow', () => {
      const input = 'Workout 08.00'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 11, h: 8, m: 0 })
      expect(r.title).toBe('Workout')
    })

    it('D20: month + bare number, month first', () => {
      const input = 'Workout Jun 1'
      const r = parse(input, new Date('2026-05-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 1, h: 0, m: 0 })
      expect(raw(r.eventDate, input)).toBe('Jun 1')
      expect(r.title).toBe('Workout')
    })

    it('D21: bare number + month, number first', () => {
      const input = 'Workout 1 Jun'
      const r = parse(input, new Date('2026-05-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 1, h: 0, m: 0 })
      expect(raw(r.eventDate, input)).toBe('1 Jun')
      expect(r.title).toBe('Workout')
    })

    it('D22: invalid ordinal suffix tolerated when month comes first', () => {
      const input = 'Workout Jun 1th'
      const r = parse(input, new Date('2026-05-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 1, h: 0, m: 0 })
      expect(r.title).toBe('Workout')
    })

    it('D23: two numbers around a month — left-to-right first date wins', () => {
      const input = 'Workout 2 Jun 1'
      const r = parse(input, new Date('2026-05-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 2, h: 0, m: 0 })
      expect(r.title).toBe('Workout 1')
    })

    it('D24: specific date followed by conflicting day-of-week — date commits without time', () => {
      // Jun 2 2026 is a Tuesday; Monday is a day-of-week, not a time → not consumed
      const input = 'Jun 2 Monday 17:00'
      const r = parse(input, new Date('2026-05-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 2, h: 0, m: 0 })
      expect(r.title).toBe('Monday 17:00')
    })

    it('D25: time before day word — reverse order not supported', () => {
      // 17 precedes Mon with no day context; Mon commits as day-only
      const input = 'Workout 17 Mon'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 0, m: 0 })
      expect(r.title).toBe('Workout 17')
    })

    it('bumps year when date already passed', () => {
      // now=Jan 15 2026; "1st Jan" → Jan 1 2026 is past → Jan 1 2027
      const r = parse('task 1st Jan', new Date('2026-01-15T10:00:00'))
      expect(local(r.eventDate?.value)?.y).toBe(2027)
    })
  })

  // ─── Duration ───────────────────────────────────────────────────────────────

  describe('duration', () => {
    it('Du1: minutes only', () => {
      const input = 'Quick call 30m'
      const r = parse(input, WED)
      expect(r.duration?.value).toBe(1800)
      expect(raw(r.duration, input)).toBe('30m')
      expect(r.title).toBe('Quick call')
    })

    it('Du2: hours only', () => {
      const input = 'Deep work 2h'
      const r = parse(input, WED)
      expect(r.duration?.value).toBe(7200)
      expect(raw(r.duration, input)).toBe('2h')
      expect(r.title).toBe('Deep work')
    })

    it('Du3: hours and minutes', () => {
      const input = 'Workshop 1h30m'
      const r = parse(input, WED)
      expect(r.duration?.value).toBe(5400)
      expect(raw(r.duration, input)).toBe('1h30m')
      expect(r.title).toBe('Workshop')
    })

    it('Du4: decimal hours', () => {
      const input = 'Review 1.5h'
      const r = parse(input, WED)
      expect(r.duration?.value).toBe(5400)
      expect(r.title).toBe('Review')
    })

    it('Du5: duration mid-string', () => {
      const input = 'Workout 1h leg day'
      const r = parse(input, WED)
      expect(r.duration?.value).toBe(3600)
      expect(r.title).toBe('Workout leg day')
    })

    it('Du6: duration combined with date', () => {
      const input = 'Workout Monday 17:00 1h30m'
      const r = parse(input, WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 17, m: 0 })
      expect(r.duration?.value).toBe(5400)
      expect(r.title).toBe('Workout')
    })
  })

  // ─── Status ─────────────────────────────────────────────────────────────────

  describe('status', () => {
    it.each([
      ['Fix bug todo', TaskStatus.TODO, 'Fix bug'],
      ['Write tests next', TaskStatus.NEXT, 'Write tests'],
      ['Refactor auth progress', TaskStatus.IN_PROGRESS, 'Refactor auth'],
      ['Deploy to staging in progress', TaskStatus.IN_PROGRESS, 'Deploy to staging'],
      ['Update docs done', TaskStatus.DONE, 'Update docs'],
      ['Old task archive', TaskStatus.ARCHIVED, 'Old task'],
    ] as const)('%s', (input, expectedStatus, expectedTitle) => {
      const r = parse(input, WED)
      expect(r.status?.value).toBe(expectedStatus)
      expect(r.title).toBe(expectedTitle)
    })

    it('S7: case insensitive', () => {
      const input = 'Fix login DONE'
      const r = parse(input, WED)
      expect(r.status?.value).toBe(TaskStatus.DONE)
      expect(raw(r.status, input)).toBe('DONE')
      expect(r.title).toBe('Fix login')
    })

    it('T3: status mid-sentence is not parsed', () => {
      // "progress" surrounded by non-parsed words on both sides → no match
      const r = parse('Mark progress on the report', WED)
      expect(r.status).toBeNull()
      expect(r.title).toBe('Mark progress on the report')
    })
  })

  // ─── Goal ───────────────────────────────────────────────────────────────────

  describe('goal', () => {
    it('G1: confirmed goal, # text exactly matches goalName', () => {
      const input = 'Workout #fitness goals'
      const r = parse(input, WED, 'uuid-1', 'fitness goals')
      expect(r.goalId?.value).toBe('uuid-1')
      expect(raw(r.goalId, input)).toBe('#fitness goals')
      expect(r.title).toBe('Workout')
    })

    it('G2: confirmed goal, # text no longer matches — goalId cleared, # token excluded from title', () => {
      const input = 'Workout #fitness goal' // missing 's'
      const r = parse(input, WED, 'uuid-1', 'fitness goals')
      expect(r.goalId).toBeNull()
      expect(r.title).toBe('Workout') // unresolved # excluded until submitted
    })

    it('G4: no confirmed goal, # preserved as-is in title', () => {
      const input = 'Workout #unknown'
      const r = parse(input, WED)
      expect(r.goalId).toBeNull()
      expect(r.title).toBe('Workout #unknown')
    })

    it('G5: bare # preserved in title when no goal context', () => {
      const input = 'Workout #'
      const r = parse(input, WED)
      expect(r.goalId).toBeNull()
      expect(r.title).toBe('Workout #')
    })

    it('G6: confirmed goal + date + duration', () => {
      const input = 'Leg day #fitness Monday 1h'
      const r = parse(input, WED, 'uuid-2', 'fitness')
      expect(r.goalId?.value).toBe('uuid-2')
      expect(raw(r.goalId, input)).toBe('#fitness')
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 0, m: 0 })
      expect(r.duration?.value).toBe(3600)
      expect(r.title).toBe('Leg day')
    })
  })

  // ─── Source URL ─────────────────────────────────────────────────────────────

  describe('sourceUrl', () => {
    it('extracts a https URL and removes it from title', () => {
      const input = 'Check https://example.com notes'
      const r = parse(input, WED)
      expect(r.sourceUrl?.value).toBe('https://example.com')
      expect(raw(r.sourceUrl, input)).toBe('https://example.com')
      expect(r.title).toBe('Check notes')
    })

    it('URL at end of input', () => {
      const input = 'Read article https://example.com/article'
      const r = parse(input, WED)
      expect(r.sourceUrl?.value).toBe('https://example.com/article')
      expect(r.title).toBe('Read article')
    })

    it('http URL supported', () => {
      const input = 'Check http://example.com'
      const r = parse(input, WED)
      expect(r.sourceUrl?.value).toBe('http://example.com')
    })

    it('multiple URLs — first wins', () => {
      const input = 'Compare https://a.com and https://b.com'
      const r = parse(input, WED)
      expect(r.sourceUrl?.value).toBe('https://a.com')
      expect(r.title).toBe('Compare and')
    })
  })

  // ─── Sprint ─────────────────────────────────────────────────────────────────

  describe('sprintKey', () => {
    // WED = Wed 10 Jun 2026 → current sprint is "26 Q2 10"

    it('Sp1: exact sprint key — YYQ<q><week>', () => {
      const input = 'Ship feature 26Q210'
      const r = parse(input, WED)
      expect(r.sprintKey?.value).toBe('26 Q2 10')
      expect(raw(r.sprintKey, input)).toBe('26Q210')
      expect(r.title).toBe('Ship feature')
    })

    it('Sp2: exact sprint key, different quarter/week', () => {
      const input = 'Plan launch 26Q301'
      const r = parse(input, WED)
      expect(r.sprintKey?.value).toBe('26 Q3 1')
      expect(r.title).toBe('Plan launch')
    })

    it('Sp3: quarter + week — resolves within current quarter when it matches', () => {
      const input = 'Ship feature Q210'
      const r = parse(input, WED)
      expect(r.sprintKey?.value).toBe('26 Q2 10')
      expect(raw(r.sprintKey, input)).toBe('Q210')
      expect(r.title).toBe('Ship feature')
    })

    it('Sp4: quarter + week — resolves forward to next occurrence when current quarter has passed it', () => {
      const input = 'Plan launch Q301'
      const r = parse(input, WED)
      expect(r.sprintKey?.value).toBe('26 Q3 1')
      expect(r.title).toBe('Plan launch')
    })

    it('Sp5: week only — resolves to current sprint when week matches now', () => {
      const input = 'Ship feature S10'
      const r = parse(input, WED)
      expect(r.sprintKey?.value).toBe('26 Q2 10')
      expect(raw(r.sprintKey, input)).toBe('S10')
      expect(r.title).toBe('Ship feature')
    })

    it('Sp6: week only — resolves forward, never to a past sprint', () => {
      const input = 'Plan launch S01'
      const r = parse(input, WED)
      expect(r.sprintKey?.value).toBe('26 Q3 1')
      expect(r.title).toBe('Plan launch')
    })

    it('Sp7: single-digit week', () => {
      const input = 'Plan launch S3'
      const r = parse(input, WED)
      expect(r.sprintKey?.value).toBe('26 Q3 3')
      expect(raw(r.sprintKey, input)).toBe('S3')
      expect(r.title).toBe('Plan launch')
    })

    it('Sp8: case insensitive', () => {
      const input = 'Ship feature q210'
      const r = parse(input, WED)
      expect(r.sprintKey?.value).toBe('26 Q2 10')
      expect(r.title).toBe('Ship feature')
    })

    it('Sp9: not a sprint token — stays in title', () => {
      const r = parse('Buy S apples', WED)
      expect(r.sprintKey).toBeNull()
      expect(r.title).toBe('Buy S apples')
    })
  })

  // ─── Combined ───────────────────────────────────────────────────────────────

  describe('combined', () => {
    it('C1: emoji + date + duration + goal', () => {
      const input = '🏋️ Workout Monday 17:00 1h30m #fitness'
      const r = parse(input, WED, 'uuid-1', 'fitness')
      expect(r.emoji?.value).toBe('🏋️')
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 17, m: 0 })
      expect(r.duration?.value).toBe(5400)
      expect(r.goalId?.value).toBe('uuid-1')
      expect(r.title).toBe('Workout')
    })

    it('C2: mid-string emoji + relative date', () => {
      const input = 'Buy 🛒 groceries tmrw'
      const r = parse(input, WED)
      expect(r.emoji?.value).toBe('🛒')
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 11, h: 0, m: 0 })
      expect(r.title).toBe('Buy groceries')
    })

    it('C3: status + date', () => {
      const input = 'Deploy to prod Friday progress'
      const r = parse(input, WED) // next Fri after Wed Jun 10 = Jun 12
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 12, h: 0, m: 0 })
      expect(r.status?.value).toBe(TaskStatus.IN_PROGRESS)
      expect(r.title).toBe('Deploy to prod')
    })
  })

  // ─── Bare title ─────────────────────────────────────────────────────────────

  describe('bare title', () => {
    it('T1: all fields null when no tokens present', () => {
      const r = parse('Take out the trash', WED)
      expect(r.title).toBe('Take out the trash')
      expect(r.emoji).toBeNull()
      expect(r.eventDate).toBeNull()
      expect(r.status).toBeNull()
      expect(r.duration).toBeNull()
      expect(r.goalId).toBeNull()
      expect(r.sourceUrl).toBeNull()
      expect(r.sprintKey).toBeNull()
    })

    it('T2: number that is not a duration or date stays in title', () => {
      const r = parse('Buy 3 apples', WED)
      expect(r.title).toBe('Buy 3 apples')
      expect(r.duration).toBeNull()
      expect(r.eventDate).toBeNull()
    })
  })

  // ─── Malformed / unsupported inputs ─────────────────────────────────────────

  describe('malformed inputs', () => {
    it('M1: time with trailing colon — not parsed', () => {
      const r = parse('Workout 17:', WED)
      expect(r.eventDate).toBeNull()
      expect(r.title).toBe('Workout 17:')
    })

    it('M2: time with single-digit minutes — not parsed', () => {
      const r = parse('Workout 17:0', WED)
      expect(r.eventDate).toBeNull()
      expect(r.title).toBe('Workout 17:0')
    })

    it('M3: invalid ordinal suffix before month — not parsed', () => {
      // "1th" is invalid when number precedes month; no lookahead for month
      const r = parse('Workout 1th Jun', new Date('2026-05-01T10:00:00'))
      expect(r.eventDate).toBeNull()
      expect(r.title).toBe('Workout 1th Jun')
    })

    it('M4: invalid ordinal suffix after month — tolerated', () => {
      // month comes first → month disambiguates, invalid suffix tolerated
      const r = parse('Workout Jun 1th', new Date('2026-05-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 1 })
      expect(r.title).toBe('Workout')
    })

    it('M7: four-digit time without separator — not parsed', () => {
      const r = parse('Workout 1700', WED)
      expect(r.eventDate).toBeNull()
      expect(r.title).toBe('Workout 1700')
    })

    it('M8: slash date separator — not supported', () => {
      const r = parse('Workout 01/02', WED)
      expect(r.eventDate).toBeNull()
      expect(r.title).toBe('Workout 01/02')
    })

    it('M9: AM/PM time — not supported (app is 24h only)', () => {
      const r = parse('Workout 3am', WED)
      expect(r.eventDate).toBeNull()
      expect(r.title).toBe('Workout 3am')
    })

    it('M10: month name with no day number followed by time — null', () => {
      const r = parse('Workout Jun 17:00', new Date('2026-05-01T10:00:00'))
      expect(r.eventDate).toBeNull()
      expect(r.title).toBe('Workout Jun 17:00')
    })

    it('M11: month followed by duration — number consumed by duration, date null', () => {
      // "1h" is consumed as duration; Jun has no remaining day number
      const r = parse('Workout Jun 1h', new Date('2026-05-01T10:00:00'))
      expect(r.eventDate).toBeNull()
      expect(r.duration?.value).toBe(3600)
      expect(r.title).toBe('Workout Jun')
    })

    it('M12: two numbers around a month — first valid date wins', () => {
      const r = parse('Workout 2 Jun 1', new Date('2026-05-01T10:00:00'))
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 2 })
      expect(r.title).toBe('Workout 1')
    })
  })

  // ─── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('X1: empty input', () => {
      const r = parse('', WED)
      expect(r.title).toBe('')
      expect(r.emoji).toBeNull()
      expect(r.eventDate).toBeNull()
      expect(r.status).toBeNull()
      expect(r.duration).toBeNull()
      expect(r.goalId).toBeNull()
      expect(r.sourceUrl).toBeNull()
      expect(r.sprintKey).toBeNull()
    })

    it('X2: only an emoji', () => {
      const r = parse('🏋️', WED)
      expect(r.emoji?.value).toBe('🏋️')
      expect(r.title).toBe('')
    })

    it('X3: only a date', () => {
      const r = parse('Monday 17:00', WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 17, m: 0 })
      expect(r.title).toBe('')
    })

    it('X4: unrecognized # with no goal context — # preserved in title', () => {
      const r = parse('Workout #fitness', WED)
      expect(r.goalId).toBeNull()
      expect(r.title).toBe('Workout #fitness')
    })

    it('X5: multiple spaces between tokens', () => {
      const r = parse('Workout   Monday   1h', WED)
      expect(local(r.eventDate?.value)).toMatchObject({ y: 2026, mo: 5, day: 15, h: 0, m: 0 })
      expect(r.duration?.value).toBe(3600)
      expect(r.title).toBe('Workout')
    })

    it('X6: "next" as status keyword, not a day', () => {
      const r = parse('Review next', WED)
      expect(r.status?.value).toBe(TaskStatus.NEXT)
      expect(r.title).toBe('Review')
    })

    it('X7: duration mid-string surrounded by title words', () => {
      const r = parse('Room 1h floor', WED)
      expect(r.duration?.value).toBe(3600)
      expect(r.title).toBe('Room floor')
    })
  })
})
