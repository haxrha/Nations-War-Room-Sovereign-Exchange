export type TradeExplainTrade = {
  commoditySymbol: string
  commodityName: string
  commodityUnit: string
  qty: number
  pricePerUnit: number
  totalCost: number
  sellerName: string
  sellerFlag: string
  sellerIsBot: boolean
  side: 'buy'
}

export type TradeExplainGameContext = {
  playerCountryName: string
  playerBalanceBefore: number
  spotPrice: number
  basePrice: number
  priceVsSpotPct: number
  priceVsBasePct: number
  spotPrices: Record<string, number>
  activeSanctionsCount: number
  sanctionsAffectingTrade: string[]
  recentSameCommodityTrades: {
    price: number
    qty: number
    sellerName: string
    buyerName: string
    agoSec: number
  }[]
  priceTrend: number[]
  openOffersSameCommodity: number
  cheapestOfferSameCommodity?: number
}

export type ExplainTradeRequest = {
  trade: TradeExplainTrade
  gameContext: TradeExplainGameContext
}

export type TradeExplanation = {
  headline: string
  analysis: string
  risks: string[]
  assumptions: string[]
  historicalComparison: string
  qualityScore: number
  qualityLabel: 'strong' | 'fair' | 'risky' | 'poor'
}

export type ExplainTradeSuccess = {
  ok: true
  explanation: TradeExplanation
}

export type ExplainTradeFailure = {
  ok: false
  error: { code: string; message: string; retryable: boolean }
}

export type ExplainTradeResponse = ExplainTradeSuccess | ExplainTradeFailure
