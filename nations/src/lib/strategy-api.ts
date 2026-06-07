import type {
  GenerateStrategyRequest,
  GenerateStrategyResponse,
} from './strategy-api-types'

export async function generateStrategy(
  request: GenerateStrategyRequest,
): Promise<GenerateStrategyResponse> {
  const res = await fetch('/api/strategy/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  const data = (await res.json()) as GenerateStrategyResponse
  return data
}
