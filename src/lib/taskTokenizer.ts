export type TokenType = 'emoji' | 'url' | 'status' | 'snooze' | 'duration' | 'goal' | 'name'

export interface Segment {
  text: string
  type: TokenType
}

interface Range {
  start: number
  end: number
  type: TokenType
}

export function tokenizeInput(input: string): Segment[] {
  const ranges: Range[] = []

  const seg = [...new Intl.Segmenter().segment(input)][0]
  if (seg && /\p{Extended_Pictographic}/u.test(seg.segment)) {
    ranges.push({ start: 0, end: seg.segment.length, type: 'emoji' })
  }

  let m: RegExpExecArray | null

  const urlRe = /https?:\/\/\S+/g
  if ((m = urlRe.exec(input))) ranges.push({ start: m.index, end: m.index + m[0].length, type: 'url' })

  const statusRe = /(?<![@@])\b(to do|in progress|progress|progres|todo|next|done|archive)\b/gi
  if ((m = statusRe.exec(input))) ranges.push({ start: m.index, end: m.index + m[0].length, type: 'status' })

  const snoozeRe = /@-?\S+/g
  if ((m = snoozeRe.exec(input))) ranges.push({ start: m.index, end: m.index + m[0].length, type: 'snooze' })

  const durRe = /\b(\d+(?:\.\d+)?h\d+m|\d+(?:\.\d+)?h|\d+m)\b/gi
  if ((m = durRe.exec(input))) ranges.push({ start: m.index, end: m.index + m[0].length, type: 'duration' })

  const goalRe = /#\w+/g
  if ((m = goalRe.exec(input))) ranges.push({ start: m.index, end: m.index + m[0].length, type: 'goal' })

  ranges.sort((a, b) => a.start - b.start)

  const segments: Segment[] = []
  let cursor = 0

  for (const range of ranges) {
    if (range.start < cursor) continue
    if (range.start > cursor) segments.push({ text: input.slice(cursor, range.start), type: 'name' })
    segments.push({ text: input.slice(range.start, range.end), type: range.type })
    cursor = range.end
  }

  if (cursor < input.length) segments.push({ text: input.slice(cursor), type: 'name' })

  return segments
}
