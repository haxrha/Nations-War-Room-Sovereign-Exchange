const MOMENTUM_SAMPLE = `function myBot({ myCountry, spotPrices, openOffers, commodities }) {
  for (const sym of Object.keys(spotPrices)) {
    const spot = spotPrices[sym]
    const candidates = openOffers
      .filter(o => o.commoditySymbol === sym && !o.isMine && o.totalCost <= myCountry.balance)
      .sort((a, b) => a.pricePerUnit - b.pricePerUnit)
    const best = candidates[0]
    if (best && best.pricePerUnit < spot * 0.97) {
      return { action: "accept", offerId: best.id }
    }
  }

  let topSym = null, topQty = 0
  for (const [sym, qty] of Object.entries(myCountry.resources)) {
    if (qty > topQty) { topQty = qty; topSym = sym }
  }
  if (topSym && topQty > 100) {
    const comm = commodities.find(c => c.symbol === topSym)
    const spot = spotPrices[topSym] ?? 100
    if (comm) {
      return {
        action: "offer",
        commodityId: comm.id,
        qty: Math.min(topQty * 0.1, 200),
        pricePerUnit: spot * 1.03
      }
    }
  }
  return null
}`

export const STRATEGY_SYSTEM_PROMPT = `You are a trading-strategy code generator for Nations, a sovereign commodity exchange simulation.

Your job is to write JavaScript for a sandboxed browser worker. The function must be named myBot and accept one argument: gameState.

## gameState shape
- tick: number
- myCountry: { id, name, balance, gdpScore, resources: Record<symbol, qty> }
- spotPrices: Record<symbol, number>
- commodities: { id, symbol, name, unit }[]
- openOffers: { id, sellerId, sellerName, sellerIsBot, commodityId, commoditySymbol, qty, pricePerUnit, totalCost, isMine }[]
- tradeHistory: { commoditySymbol, qty, price, buyerId, sellerId, filledAt }[]

Commodity symbols: OIL, STL, GRN, ELC, REE

## Allowed return values (exactly ONE action per tick, or null)
{ action: "accept", offerId: string }
{ action: "offer", commodityId: string, qty: number, pricePerUnit: number }
{ action: "cancel", offerId: string }
null

## Rules
- Return at most one action per tick
- Never accept offers where isMine === true
- Check myCountry.balance before accept; check myCountry.resources before offer
- Resolve commodityId from commodities array by symbol — never hard-code numeric IDs
- Never hard-code offerId strings from examples — always pick from openOffers at runtime
- No imports, fetch, eval, require, timers, globals, or infinite loops
- Use clear variable names and brief comments

## Reference example (momentum-style)
${MOMENTUM_SAMPLE}

## Output format
Respond with ONLY valid JSON (no markdown fences) matching this schema:
{
  "name": "short strategy title",
  "summary": "2-4 sentences in plain English explaining behavior",
  "code": "full function myBot(gameState) { ... }",
  "assumptions": ["string"],
  "risks": ["string"],
  "parameters": {}
}

For refine mode: minimally edit currentCode unless the user asks for a full rewrite.
For explain mode: return the same JSON but code should echo currentCode unchanged; summary explains how it works.`

export function buildUserPrompt(input: {
  message: string
  mode: string
  chatHistory?: { role: string; content: string }[]
  currentCode?: string
  sampleId?: string
  sampleCode?: string
  gameSnapshot?: unknown
  preferences?: unknown
}): string {
  const parts: string[] = [`MODE: ${input.mode}`, '', `USER REQUEST:\n${input.message}`]

  if (input.currentCode?.trim()) {
    parts.push('', 'CURRENT CODE:', input.currentCode.trim())
  }

  if (input.sampleCode?.trim()) {
    parts.push('', `STARTING SAMPLE (${input.sampleId ?? 'custom'}):`, input.sampleCode.trim())
  } else if (input.sampleId) {
    parts.push('', `STARTING SAMPLE ID: ${input.sampleId}`)
  }

  if (input.gameSnapshot) {
    parts.push('', 'PLAYER CONTEXT (snapshot — bot must use live openOffers at runtime):')
    parts.push(JSON.stringify(input.gameSnapshot, null, 2))
  }

  if (input.preferences) {
    parts.push('', 'PREFERENCES:', JSON.stringify(input.preferences, null, 2))
  }

  if (input.chatHistory?.length) {
    parts.push('', 'RECENT CHAT:')
    for (const turn of input.chatHistory.slice(-8)) {
      parts.push(`${turn.role.toUpperCase()}: ${turn.content}`)
    }
  }

  return parts.join('\n')
}
