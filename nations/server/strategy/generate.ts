import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  GenerateStrategyRequest,
  GenerateStrategyResponse,
  GeneratedStrategy,
} from '../../src/lib/strategy-api-types.ts'
import { STRATEGY_SYSTEM_PROMPT, buildUserPrompt } from './prompt.ts'
import { isStrategyCodeSafe, validateStrategyCode } from './validate.ts'

const DEFAULT_MODEL = 'gemini-2.0-flash'
const MAX_HISTORY = 10

type RateBucket = { count: number; resetAt: number }
const rateLimits = new Map<string, RateBucket>()
const RATE_LIMIT = 2
const RATE_WINDOW_MS = 60 * 60 * 1000

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

function parseModelJson(text: string): GeneratedStrategy {
  const trimmed = text.trim()
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed

  const parsed = JSON.parse(jsonText) as Record<string, unknown>
  const code = String(parsed.code ?? '')
  if (!code.trim()) throw new Error('Model response missing code field')

  return {
    name: String(parsed.name ?? 'Custom strategy'),
    summary: String(parsed.summary ?? ''),
    code,
    assumptions: Array.isArray(parsed.assumptions)
      ? parsed.assumptions.map(String)
      : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    parameters:
      parsed.parameters && typeof parsed.parameters === 'object'
        ? (parsed.parameters as Record<string, unknown>)
        : {},
  }
}

export async function handleStrategyGenerate(
  body: GenerateStrategyRequest,
  options: { apiKey: string; clientKey?: string },
): Promise<GenerateStrategyResponse> {
  const { apiKey, clientKey = 'default' } = options

  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY is not configured on the server. Add it to nations/.env.local',
        retryable: false,
      },
    }
  }

  const message = body.message?.trim()
  if (!message) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'message is required',
        retryable: false,
      },
    }
  }

  const rateError = checkRateLimit(clientKey)
  if (rateError) {
    return {
      ok: false,
      error: { code: 'RATE_LIMITED', message: rateError, retryable: true },
    }
  }

  const mode =
    body.mode ??
    (body.context?.currentCode?.trim() ? 'refine' : 'generate')

  const chatHistory = (body.chatHistory ?? []).slice(-MAX_HISTORY)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: STRATEGY_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    })

    const userPrompt = buildUserPrompt({
      message,
      mode,
      chatHistory,
      currentCode: body.context?.currentCode,
      sampleId: body.context?.sampleId,
      sampleCode: body.context?.sampleCode,
      gameSnapshot: body.context?.gameSnapshot ?? undefined,
      preferences: body.preferences,
    })

    const result = await model.generateContent(userPrompt)
    const text = result.response.text()
    if (!text) {
      return {
        ok: false,
        error: {
          code: 'EMPTY_RESPONSE',
          message: 'Gemini returned an empty response',
          retryable: true,
        },
      }
    }

    let strategy: GeneratedStrategy
    try {
      strategy = parseModelJson(text)
    } catch {
      return {
        ok: false,
        error: {
          code: 'INVALID_OUTPUT',
          message: 'Could not parse strategy JSON from the model',
          retryable: true,
        },
      }
    }

    const validation = validateStrategyCode(strategy.code)
    if (validation.forbiddenPatterns.length > 0) {
      return {
        ok: false,
        error: {
          code: 'UNSAFE_CODE',
          message: `Generated code uses forbidden APIs: ${validation.forbiddenPatterns.join(', ')}`,
          retryable: true,
        },
      }
    }

    if (!isStrategyCodeSafe(strategy.code) && mode !== 'explain') {
      return {
        ok: false,
        error: {
          code: 'INVALID_OUTPUT',
          message: 'Generated code failed validation — try rephrasing your request',
          retryable: true,
        },
      }
    }

    const usage = result.response.usageMetadata

    return {
      ok: true,
      strategy,
      validation,
      usage: {
        model: DEFAULT_MODEL,
        inputTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      error: {
        code: 'UPSTREAM_ERROR',
        message: msg,
        retryable: true,
      },
    }
  }
}
