import type { ParseHit, ParseContext, PropertyParser, Token } from '../parser'

export const GOAL_COLOR = '#4ade80'

// A `#tag` resolves to a goal only when its words match the active goal's name.
// A matched-but-mismatched `#` is consumed (dropped from the title) without a value;
// with no goal context the `#` is left untouched in the title.
export const goalParser: PropertyParser = {
  key: 'goalId',
  parse(tokens: Token[], { goalId, goalName }: ParseContext): ParseHit | null {
    for (let i = 0; i < tokens.length; i++) {
      if (!tokens[i].text.startsWith('#')) continue
      if (!goalId || !goalName) return null // no goal context — keep # in title

      const hashFirst = tokens[i].text.slice(1)
      const goalWords = goalName.split(' ')
      if (hashFirst !== goalWords[0]) {
        return { consume: [i], start: tokens[i].start, end: tokens[i].end, value: null }
      }

      let match = true
      let endI = i
      for (let g = 1; g < goalWords.length; g++) {
        const next = tokens[i + g]
        if (next && next.text === goalWords[g]) {
          endI = i + g
        } else {
          match = false
          // partial match: drop as many tokens as the goal name has words
          endI = Math.min(i + goalWords.length - 1, tokens.length - 1)
          break
        }
      }

      const consume: number[] = []
      for (let g = i; g <= endI; g++) consume.push(g)
      return { consume, start: tokens[i].start, end: tokens[endI].end, value: match ? goalId : null }
    }
    return null
  },
}
