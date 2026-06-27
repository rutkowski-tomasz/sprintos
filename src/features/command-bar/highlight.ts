import { PROPERTY_COLORS } from '@/features/properties/registry'
import type { ParseResult } from './taskInputParser'

const SPAN_COLORS: Record<string, string> = {
  date: PROPERTY_COLORS.eventDate,
  duration: PROPERTY_COLORS.duration,
  emoji: PROPERTY_COLORS.emoji,
  status: PROPERTY_COLORS.status,
  goal: PROPERTY_COLORS.goal,
  url: PROPERTY_COLORS.url,
}

export interface HighlightSegment {
  text: string
  color: string
  underline: boolean
}

// Splits the raw input into coloured segments — parsed properties underlined in
// their property colour, the rest plain white.
export function buildHighlightSegments(input: string, parsed: ParseResult): HighlightSegment[] {
  const spans = [
    parsed.emoji && { start: parsed.emoji.start, end: parsed.emoji.end, type: 'emoji' },
    parsed.eventDate && { start: parsed.eventDate.start, end: parsed.eventDate.end, type: 'date' },
    parsed.duration && { start: parsed.duration.start, end: parsed.duration.end, type: 'duration' },
    parsed.status && { start: parsed.status.start, end: parsed.status.end, type: 'status' },
    parsed.goalId && { start: parsed.goalId.start, end: parsed.goalId.end, type: 'goal' },
    parsed.sourceUrl && { start: parsed.sourceUrl.start, end: parsed.sourceUrl.end, type: 'url' },
  ].filter(Boolean) as Array<{ start: number; end: number; type: string }>

  spans.sort((a, b) => a.start - b.start)

  const segments: HighlightSegment[] = []
  let pos = 0
  for (const span of spans) {
    if (span.start > pos) segments.push({ text: input.slice(pos, span.start), color: '#fff', underline: false })
    segments.push({ text: input.slice(span.start, span.end), color: SPAN_COLORS[span.type], underline: true })
    pos = span.end
  }
  if (pos < input.length) segments.push({ text: input.slice(pos), color: '#fff', underline: false })
  return segments
}
