import type { ParseHit, PropertyParser, Token } from '../parser'

export const EMOJI_COLOR = '#fff'

// Matches emoji_presentation emojis AND text-default emojis made emoji by U+FE0F
const EMOJI_START = /^(?:\p{Emoji_Presentation}|\p{Emoji}️)/u
const EMOJI_CONT = /^(?:️|⃣|‍\p{Emoji}|\p{Emoji_Modifier}|\p{Emoji_Presentation})/u

// First emoji wins; later emojis stay in the title.
export const emojiParser: PropertyParser = {
  key: 'emoji',
  parse(tokens: Token[]): ParseHit | null {
    for (let i = 0; i < tokens.length; i++) {
      const text = tokens[i].text
      if (!EMOJI_START.test(text)) continue
      // grab whole grapheme cluster: walk char by char collecting continuation chars
      const startM = EMOJI_START.exec(text)
      if (!startM) continue
      let pos = startM[0].length
      while (pos < text.length) {
        const cm = EMOJI_CONT.exec(text.slice(pos))
        if (!cm) break
        pos += cm[0].length
      }
      return { consume: [i], start: tokens[i].start, end: tokens[i].start + pos, value: text.slice(0, pos) }
    }
    return null
  },
}
