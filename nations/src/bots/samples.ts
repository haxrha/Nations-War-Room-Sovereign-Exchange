export type BotSample = { id: string; name: string; description: string; code: string }

export const BOT_SAMPLES: BotSample[] = [
  {
    id: 'momentum',
    name: 'Momentum trader',
    description: 'Buys when price is below spot; sells when holding surplus.',
    code: `function myBot({ myCountry, spotPrices, openOffers, commodities }) {
  // Buy cheapest offer below 97% of spot
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

  // Sell 10% of largest holding slightly above spot
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
}`,
  },
  {
    id: 'mean-reversion',
    name: 'Mean reversion',
    description: 'Fades extremes — buys cheap, sells expensive vs spot.',
    code: `function myBot({ myCountry, spotPrices, openOffers, commodities }) {
  for (const offer of openOffers.filter(o => !o.isMine)) {
    const spot = spotPrices[offer.commoditySymbol]
    if (!spot) continue
    if (offer.pricePerUnit < spot * 0.92 && offer.totalCost <= myCountry.balance) {
      return { action: "accept", offerId: offer.id }
    }
  }

  for (const comm of commodities) {
    const qty = myCountry.resources[comm.symbol] ?? 0
    const spot = spotPrices[comm.symbol]
    if (!spot || qty < 50) continue
    const myOffers = openOffers.filter(o => o.isMine && o.commoditySymbol === comm.symbol)
    if (myOffers.length >= 2) continue
    return {
      action: "offer",
      commodityId: comm.id,
      qty: Math.min(qty * 0.15, 150),
      pricePerUnit: spot * 1.08
    }
  }
  return null
}`,
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage hunter',
    description: 'Snipes the best mispriced offer each tick.',
    code: `function myBot({ myCountry, spotPrices, openOffers }) {
  let best = null
  let bestEdge = 0

  for (const offer of openOffers) {
    if (offer.isMine) continue
    const spot = spotPrices[offer.commoditySymbol]
    if (!spot) continue
    if (offer.totalCost > myCountry.balance) continue
    const edge = (spot - offer.pricePerUnit) / spot
    if (edge > bestEdge) {
      bestEdge = edge
      best = offer
    }
  }

  if (best && bestEdge > 0.03) {
    return { action: "accept", offerId: best.id }
  }
  return null
}`,
  },
]

export const DEFAULT_BOT_CODE = BOT_SAMPLES[0]!.code

const STORAGE_KEY = 'nations_bot_code'
const STATS_KEY = 'nations_bot_session_stats'

export function loadBotCode(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_BOT_CODE
}

export function saveBotCode(code: string) {
  localStorage.setItem(STORAGE_KEY, code)
}

export function loadBotSessionStats(): import('./types').BotSessionEntry[] {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as import('./types').BotSessionEntry[]
  } catch {
    return []
  }
}

export function upsertBotSession(entry: import('./types').BotSessionEntry) {
  const all = loadBotSessionStats().filter((e) => e.id !== entry.id)
  all.push(entry)
  all.sort((a, b) => b.pnl - a.pnl)
  localStorage.setItem(STATS_KEY, JSON.stringify(all.slice(0, 20)))
}
