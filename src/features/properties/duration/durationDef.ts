import type { ParseHit, PropertyParser, Token } from '../parser'

export const DURATION_COLOR = '#2dd4bf'

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h && m) return `${h}h${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

const DURATION_RE = /^(\d+(?:\.\d+)?h)?(\d+m)?$/i

export const durationParser: PropertyParser = {
  key: 'duration',
  parse(tokens: Token[]): ParseHit | null {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      const m = DURATION_RE.exec(t.text)
      if (m && (m[1] || m[2]) && t.text.length > 1) {
        const hPart = m[1] ? parseFloat(m[1]) : 0
        const mPart = m[2] ? parseInt(m[2]) : 0
        const secs = Math.round(hPart * 3600) + mPart * 60
        if (secs > 0) return { consume: [i], start: t.start, end: t.end, value: secs }
      }
    }
    return null
  },
}
