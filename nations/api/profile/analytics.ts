import type { IncomingMessage, ServerResponse } from 'http'
import { handleProfileAnalytics } from '../../server/profile/analytics'
import type { ProfileAnalyticsRequest } from '../../src/lib/profile-analytics-types'

export const config = { api: { bodyParser: true } }

export default async function handler(
  req: IncomingMessage & { body?: ProfileAnalyticsRequest },
  res: ServerResponse,
) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only', retryable: false } }))
    return
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'vercel'

  const result = await handleProfileAnalytics(req.body ?? ({} as ProfileAnalyticsRequest), {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    clientKey: ip,
  })

  res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}
