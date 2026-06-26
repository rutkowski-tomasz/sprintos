import emojilib from 'emojilib'

const entries = Object.entries(emojilib) as [string, string[]][]

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function bestDistance(word: string, keywords: string[]): number {
  let best = Infinity
  for (const k of keywords) {
    if (k.includes(word)) return 0
    if (word.length >= 4) best = Math.min(best, levenshtein(word, k))
  }
  return best
}

export function searchEmojis(query: string, max = 3): string[] {
  if (!query.trim()) return []
  const words = query.trim().toLowerCase().split(/\s+/)
  const scored = new Map<string, number>()
  for (const word of words) {
    for (const [emoji, keywords] of entries) {
      const dist = bestDistance(word, keywords)
      if (dist <= 2) {
        const prev = scored.get(emoji) ?? Infinity
        if (dist < prev) scored.set(emoji, dist)
      }
    }
  }
  return [...scored.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, max)
    .map(([emoji]) => emoji)
}
