import type { ExplainTradeRequest, ExplainTradeResponse } from './trade-explain-types'

export async function explainTrade(payload: ExplainTradeRequest): Promise<ExplainTradeResponse> {
  const res = await fetch('/api/trade/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<ExplainTradeResponse>
}
