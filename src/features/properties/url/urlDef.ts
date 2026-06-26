import type { ParseHit, PropertyParser, Token } from '../parser'

export const URL_COLOR = '#60a5fa'

// All URLs are consumed; the first becomes the highlighted span and the value.
export const urlParser: PropertyParser = {
  key: 'sourceUrl',
  parse(tokens: Token[]): ParseHit | null {
    let firstIdx = -1
    const consume: number[] = []
    for (let i = 0; i < tokens.length; i++) {
      if (/^https?:\/\//i.test(tokens[i].text)) {
        if (firstIdx < 0) firstIdx = i
        consume.push(i)
      }
    }
    if (firstIdx < 0) return null
    const t = tokens[firstIdx]
    return { consume, start: t.start, end: t.end, value: t.text }
  },
}
