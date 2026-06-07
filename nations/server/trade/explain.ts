import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  ExplainTradeRequest,
  ExplainTradeResponse,
  TradeExplanation,
} from '../../src/lib/trade-explain-types'

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

const TRADE_EXPLAIN_PROMPT = `You are a trading tutor for Nations, a sovereign commodity exchange simulation.

Analyze the player's completed BUY trade using ONLY the game data provided. Be concise, educational, and specific — reference actual prices, percentages, and market context from the payload.

Commodity symbols: OIL (Crude Oil), STL (Steel), GRN (Grain), ELC (Electronics), REE (Rare Earths).

Respond with ONLY valid JSON (no markdown):
{
  "headline": "one punchy sentence summarizing the trade quality",
  "analysis": "2-4 sentences explaining the decision in plain English",
  "risks": ["specific risk 1", "specific risk 2"],
  "assumptions": ["assumption the player is making"],
  "historicalComparison": "1-2 sentences comparing to recent trades and price trends in the data",
  "qualityScore": 0-100,
  "qualityLabel": "strong" | "fair" | "risky" | "poor"
}

Score guidelines:
- strong (75-100): at or below spot, good vs recent trades, affordable relative to balance
- fair (50-74): reasonable but not optimal
- risky (25-49): above spot, thin margin, concentration risk
- poor (0-24): clearly overpaid vs spot/market or strains treasury`

function parseExplanation(text: string): TradeExplanation {
  const trimmed = text.trim()
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed

  const parsed = JSON.parse(jsonText) as Record<string, unknown>
  const score = Math.max(0, Math.min(100, Number(parsed.qualityScore ?? 50)))
  const label = String(parsed.qualityLabel ?? 'fair') as TradeExplanation['qualityLabel']
  const validLabels = new Set(['strong', 'fair', 'risky', 'poor'])

  return {
    headline: String(parsed.headline ?? 'Trade completed'),
    analysis: String(parsed.analysis ?? ''),
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.map(String) : [],
    historicalComparison: String(parsed.historicalComparison ?? ''),
    qualityScore: score,
    qualityLabel: validLabels.has(label) ? label : 'fair',
  }
}

export async function handleTradeExplain(
  body: ExplainTradeRequest,
  options: { apiKey: string; clientKey?: string },
): Promise<ExplainTradeResponse> {
  const { apiKey, clientKey = 'default' } = options

  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY is not configured on the server. Add it to nations/.env',
        retryable: false,
      },
    }
  }

  if (!body.trade?.commoditySymbol) {
    return {
      ok: false,
      error: { code: 'INVALID_REQUEST', message: 'trade payload required', retryable: false },
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
      systemInstruction: TRADE_EXPLAIN_PROMPT,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 1024,
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

    return { ok: true, explanation: parseExplanation(text) }
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'GEMINI_ERROR',
        message: e instanceof Error ? e.message : 'Failed to explain trade',
        retryable: true,
      },
    }
  }
}
