import data from '@emoji-mart/data'
import { init, SearchIndex } from 'emoji-mart'

let ready = false

async function ensureInit() {
  if (!ready) { await init({ data }); ready = true }
}

export async function searchEmojis(query: string, max = 3): Promise<string[]> {
  if (!query.trim()) return []
  await ensureInit()
  const results = await SearchIndex.search(query)
  return (results ?? []).slice(0, max).map((e: any) => e.skins[0].native)
}
