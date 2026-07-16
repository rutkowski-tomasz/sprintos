import type { ParseHit, PropertyParser, Token } from '../parser'

export const EMOJI_COLOR = '#fff'

// Matches emoji_presentation emojis AND text-default emojis made emoji by U+FE0F
const EMOJI_START = /^(?:\p{Emoji_Presentation}|\p{Emoji}️)/u
const EMOJI_CONT = /^(?:️|⃣|‍\p{Emoji}|\p{Emoji_Modifier}|\p{Regional_Indicator})/u

// Splits the leading emoji grapheme cluster off `text`. Returns an empty `emoji` if `text` doesn't start with one.
export function splitLeadingEmoji(text: string): { emoji: string; rest: string } {
  const startM = EMOJI_START.exec(text)
  if (!startM) return { emoji: '', rest: text }
  let pos = startM[0].length
  while (pos < text.length) {
    const cm = EMOJI_CONT.exec(text.slice(pos))
    if (!cm) break
    pos += cm[0].length
  }
  return { emoji: text.slice(0, pos), rest: text.slice(pos) }
}

const EMOJI_CLUSTER_GLOBAL = new RegExp(`${EMOJI_START.source.slice(1)}(?:${EMOJI_CONT.source.slice(1)})*`, 'gu')

// Finds the first emoji grapheme cluster anywhere in `text`, wherever it falls.
export function findFirstEmoji(text: string): { emoji: string; start: number; end: number } | null {
  const m = text.matchAll(EMOJI_CLUSTER_GLOBAL).next().value
  if (!m) return null
  return { emoji: m[0], start: m.index, end: m.index + m[0].length }
}

// First emoji wins; later emojis stay in the title.
export const emojiParser: PropertyParser = {
  key: 'emoji',
  parse(tokens: Token[]): ParseHit | null {
    for (let i = 0; i < tokens.length; i++) {
      const text = tokens[i].text
      const { emoji } = splitLeadingEmoji(text)
      if (!emoji) continue
      return { consume: [i], start: tokens[i].start, end: tokens[i].start + emoji.length, value: emoji }
    }
    return null
  },
}
