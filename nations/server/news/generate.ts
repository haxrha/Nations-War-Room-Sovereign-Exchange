import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  NewsGenerateRequest,
  NewsGenerateResponse,
  NewsItem,
  CommodityForecast,
} from '../../src/lib/news-types.ts'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 1000
type RateBucket = { count: number; resetAt: number }
const rateLimits = new Map<string, RateBucket>()

function checkRateLimit(clientKey: string): string | null {
  const now = Date.now()
  let bucket = rateLimits.get(clientKey)
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS }
    rateLimits.set(clientKey, bucket)
  }
  bucket.count++
  if (bucket.count > RATE_LIMIT) return `Rate limit exceeded (${RATE_LIMIT}/min). Try again shortly.`
  return null
}

const SYSTEM_PROMPT = `You are the broadcast AI for NNN — Nations News Network — a synthetic financial news terminal for a live sovereign commodity trading simulation.

Commodities: OIL (Crude Oil $/bbl), STL (Steel $/t), GRN (Grain $/t), ELC (Electronics $/unit), REE (Rare Earths $/kg).
Anchors: ARIA-7, NOVA, HELIX-3, CIPHER (rotate them across items).

Generate 5 news items from the market data provided. Use actual prices and percentages. Sound like Bloomberg meets cyberpunk.

Also generate 1-sentence forecasts for each commodity with confidence scores.

Respond ONLY with valid JSON (no markdown):
{
  "items": [
    {
      "id": "n1",
      "anchor": "ARIA-7",
      "category": "BREAKING|MARKET|GEOPOLITICAL|ANALYSIS|PREDICTION",
      "ticker": "OIL+28%",
      "headline": "headline under 12 words",
      "body": "2-3 sentences referencing real data from the payload.",
      "sentiment": "bullish|bearish|neutral",
      "affectedSymbols": ["OIL"],
      "impact": "one sentence market impact"
    }
  ],
  "marketMood": "RISK-ON|RISK-OFF|NEUTRAL|VOLATILE",
  "moodReason": "one sentence why",
  "forecasts": {
    "OIL": {
      "outlook": "bullish|bearish|neutral",
      "confidence": 72,
      "rationale": "1-2 sentences",
      "shortTarget": "+8% in ~5min",
      "longTarget": "+15% in ~30min",
      "risk": "key downside risk in a few words"
    }
  }
}`

function parseResponse(text: string): { items: NewsItem[]; marketMood: string; moodReason: string; forecasts: Record<string, CommodityForecast> } {
  const trimmed = text.trim()
  const json = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed
  const parsed = JSON.parse(json)
  return parsed
}

export async function handleNewsGenerate(
  body: NewsGenerateRequest,
  options: { apiKey: string; clientKey?: string; model?: string },
): Promise<NewsGenerateResponse> {
  const { apiKey, clientKey = 'default', model = 'gemini-2.5-flash-lite' } = options

  if (!apiKey) {
    return {
      ok: false,
      error: { code: 'MISSING_API_KEY', message: 'GEMINI_API_KEY not configured', retryable: false },
    }
  }

  const rateError = checkRateLimit(clientKey)
  if (rateError) {
    return { ok: false, error: { code: 'RATE_LIMITED', message: rateError, retryable: true } }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    })

    const result = await geminiModel.generateContent(JSON.stringify(body, null, 2))
    const text = result.response.text()
    if (!text) {
      return { ok: false, error: { code: 'EMPTY_RESPONSE', message: 'Empty response from model', retryable: true } }
    }

    const parsed = parseResponse(text)

    return {
      ok: true,
      items: parsed.items ?? [],
      marketMood: (parsed.marketMood ?? 'NEUTRAL') as import('../../src/lib/news-types.ts').MarketMood,
      moodReason: parsed.moodReason ?? '',
      forecasts: parsed.forecasts ?? {},
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'News generation failed'
    return { ok: false, error: { code: 'GEMINI_ERROR', message: msg, retryable: true } }
  }
}
