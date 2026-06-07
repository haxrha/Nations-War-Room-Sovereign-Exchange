import type { IncomingMessage, ServerResponse } from 'http'
import { handleTradeExplain } from '../../server/trade/explain'
import type { ExplainTradeRequest } from '../../src/lib/trade-explain-types'

export const config = { api: { bodyParser: true } }

export default async function handler(
  req: IncomingMessage & { body?: ExplainTradeRequest },
  res: ServerResponse,
) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only', retryable: false } }))
    return
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'vercel'

  const result = await handleTradeExplain(req.body ?? ({} as ExplainTradeRequest), {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    clientKey: ip,
  })

  res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}
