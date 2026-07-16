import type { Token } from '@/features/properties/parser'
import { PROPERTY_PARSERS } from '@/features/properties/parser'
import { findFirstEmoji } from '@/features/properties/emoji/emojiDef'

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
  sprintKey: (Omit<Span, 'value'> & { value: string }) | null
}

function tokenise(input: string): Token[] {
  const tokens: Token[] = []
  const re = /\S+/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    const text = m[0]
    const hit = findFirstEmoji(text)
    if (!hit) {
      tokens.push({ text, start: m.index, end: m.index + text.length })
      continue
    }
    const before = text.slice(0, hit.start)
    const after = text.slice(hit.end)
    if (before) tokens.push({ text: before, start: m.index, end: m.index + hit.start })
    tokens.push({ text: hit.emoji, start: m.index + hit.start, end: m.index + hit.end })
    if (after) tokens.push({ text: after, start: m.index + hit.end, end: m.index + text.length })
  }
  return tokens
}

export function parse(
  input: string,
  now: Date,
  goalId?: string,
  goalName?: string,
): ParseResult {
  const tokens = tokenise(input)
  const consumed = new Set<number>()
  const ctx = { now, goalId, goalName }
  const fields: Partial<Record<string, { value: unknown; start: number; end: number }>> = {}

  // Each parser sees only the tokens left unconsumed by the parsers before it.
  for (const parser of PROPERTY_PARSERS) {
    const remaining = tokens.map((t, i) => ({ t, i })).filter(x => !consumed.has(x.i))
    const hit = parser.parse(remaining.map(x => x.t), ctx)
    if (!hit) continue
    for (const ri of hit.consume) consumed.add(remaining[ri].i)
    if (hit.value !== null) fields[parser.key] = { value: hit.value, start: hit.start, end: hit.end }
  }

  const title = tokens.filter((_, i) => !consumed.has(i)).map(t => t.text).join(' ').trim()

  return {
    title,
    emoji: (fields.emoji as ParseResult['emoji']) ?? null,
    eventDate: (fields.eventDate as ParseResult['eventDate']) ?? null,
    duration: (fields.duration as ParseResult['duration']) ?? null,
    status: (fields.status as ParseResult['status']) ?? null,
    goalId: (fields.goalId as ParseResult['goalId']) ?? null,
    sourceUrl: (fields.sourceUrl as ParseResult['sourceUrl']) ?? null,
    sprintKey: (fields.sprintKey as ParseResult['sprintKey']) ?? null,
  }
}
