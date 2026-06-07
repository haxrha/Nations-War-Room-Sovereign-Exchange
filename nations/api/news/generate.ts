import type { IncomingMessage, ServerResponse } from 'http'
import { handleNewsGenerate } from '../../server/news/generate.ts'
import type { NewsGenerateRequest } from '../../src/lib/news-types.ts'

export const config = { api: { bodyParser: true } }

export default async function handler(
  req: IncomingMessage & { body?: NewsGenerateRequest },
  res: ServerResponse,
) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only', retryable: false } }))
    return
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'vercel'

  const result = await handleNewsGenerate(req.body ?? ({} as NewsGenerateRequest), {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    clientKey: ip,
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
  })

  res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}
