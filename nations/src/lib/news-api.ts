import type { NewsGenerateRequest, NewsGenerateResponse } from './news-types'

export async function generateNews(body: NewsGenerateRequest): Promise<NewsGenerateResponse> {
  const res = await fetch('/api/news/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<NewsGenerateResponse>
}
