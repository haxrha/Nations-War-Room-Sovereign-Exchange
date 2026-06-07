import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  ProfileAnalytics,
  ProfileAnalyticsRequest,
  ProfileAnalyticsResponse,
} from '../../src/lib/profile-analytics-types'

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'

type RateBucket = { count: number; resetAt: number }
const rateLimits = new Map<string, RateBucket>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 1000

function checkRateLimit(clientKey: string): string | null {
  const now = Date.now()
  let bucket = rateLimits.get(clientKey)
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS }
    rateLimits.set(clientKey, bucket)
  }
  bucket.count += 1
  if (bucket.count > RATE_LIMIT) {
    return `Rate limit exceeded (${RATE_LIMIT}/hour). Try again later.`
  }
  return null
}

const PROFILE_ANALYTICS_PROMPT = `You are a sovereign wealth advisor for Nations, a live commodity trading simulation.

Given the player's portfolio JSON, produce actionable trading intelligence using ONLY the provided numbers and market context.

Commodity symbols: OIL, STL, GRN, ELC, REE.

Respond with ONLY valid JSON (no markdown):
{
  "headline": "one compelling dashboard headline",
  "summary": "2-3 sentences on overall financial posture",
  "metrics": [
    { "label": "short metric name", "value": "formatted value", "hint": "optional context", "sentiment": "positive" | "neutral" | "negative" }
  ],
  "opportunities": [
    { "commodity": "SYMBOL", "action": "buy" | "sell" | "hold" | "watch", "rationale": "specific reason using prices/holdings" }
  ],
  "risks": ["specific risk tied to data"],
  "watchlist": ["SYMBOL or market event to monitor"]
}

Guidelines:
- Include 3-5 metrics (liquidity, concentration, cash runway, rank momentum, etc.)
- Include 2-4 opportunities ranked by conviction
- Reference actual spot prices, holdings, net worth, and cheapest offers when suggesting trades
- If cash is low, warn about liquidity; if one commodity dominates portfolio, flag concentration`

function parseAnalytics(text: string): ProfileAnalytics {
  const trimmed = text.trim()
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed

  const parsed = JSON.parse(jsonText) as Record<string, unknown>
  const sentiments = new Set(['positive', 'neutral', 'negative'])
  const actions = new Set(['buy', 'sell', 'hold', 'watch'])

  return {
    headline: String(parsed.headline ?? 'Portfolio overview'),
    summary: String(parsed.summary ?? ''),
    metrics: Array.isArray(parsed.metrics)
      ? parsed.metrics.map((m: Record<string, unknown>) => ({
          label: String(m.label ?? ''),
          value: String(m.value ?? ''),
          hint: m.hint ? String(m.hint) : undefined,
          sentiment: sentiments.has(String(m.sentiment))
            ? (String(m.sentiment) as ProfileAnalytics['metrics'][0]['sentiment'])
            : 'neutral',
        }))
      : [],
    opportunities: Array.isArray(parsed.opportunities)
      ? parsed.opportunities.map((o: Record<string, unknown>) => ({
          commodity: String(o.commodity ?? ''),
          action: actions.has(String(o.action))
            ? (String(o.action) as ProfileAnalytics['opportunities'][0]['action'])
            : 'watch',
          rationale: String(o.rationale ?? ''),
        }))
      : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist.map(String) : [],
  }
}

export async function handleProfileAnalytics(
  body: ProfileAnalyticsRequest,
  options: { apiKey: string; clientKey?: string },
): Promise<ProfileAnalyticsResponse> {
  const { apiKey, clientKey = 'default' } = options

  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY is not configured. Add it to nations/.env',
        retryable: false,
      },
    }
  }

  if (!body.player?.name) {
    return {
      ok: false,
      error: { code: 'INVALID_REQUEST', message: 'player profile required', retryable: false },
    }
  }

  const rateError = checkRateLimit(clientKey)
  if (rateError) {
    return { ok: false, error: { code: 'RATE_LIMITED', message: rateError, retryable: true } }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: PROFILE_ANALYTICS_PROMPT,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1536,
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent(JSON.stringify(body, null, 2))
    const text = result.response.text()
    if (!text) {
      return {
        ok: false,
        error: { code: 'EMPTY_RESPONSE', message: 'Gemini returned an empty response', retryable: true },
      }
    }

    return { ok: true, analytics: parseAnalytics(text) }
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'GEMINI_ERROR',
        message: e instanceof Error ? e.message : 'Failed to generate analytics',
        retryable: true,
      },
    }
  }
}
