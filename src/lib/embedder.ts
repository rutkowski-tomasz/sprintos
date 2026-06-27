import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'

let extractor: FeatureExtractionPipeline | null = null
let loading = false

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (extractor) return extractor
  if (loading) {
    await new Promise<void>(resolve => {
      const check = setInterval(() => { if (extractor) { clearInterval(check); resolve() } }, 50)
    })
    return extractor!
  }
  loading = true
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  loading = false
  return extractor
}

export async function embed(text: string): Promise<number[]> {
  const ext = await getExtractor()
  const output = await ext(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}
