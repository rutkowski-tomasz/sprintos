import { emojiParser } from './emoji/emojiDef'
import { urlParser } from './url/urlDef'
import { goalParser } from './goal/goalDef'
import { durationParser } from './duration/durationDef'
import { dateParser } from './event-date/eventDateDef'
import { statusParser } from './status/statusDef'

export interface Token {
  text: string
  start: number
  end: number
}

export interface ParseContext {
  now: Date
  goalId?: string
  goalName?: string
}

export interface ParseHit {
  consume: number[]
  start: number
  end: number
  value: unknown
}

export type PropertyKey = 'emoji' | 'eventDate' | 'duration' | 'status' | 'goalId' | 'sourceUrl'

export interface PropertyParser {
  key: PropertyKey
  parse: (tokens: Token[], ctx: ParseContext) => ParseHit | null
}

// Precedence is array order: each parser runs against the tokens left unconsumed
// by the parsers above it.
export const PROPERTY_PARSERS: PropertyParser[] = [
  emojiParser,
  urlParser,
  goalParser,
  durationParser,
  dateParser,
  statusParser,
]
