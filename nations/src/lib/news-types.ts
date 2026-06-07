export type NewsAnchor = 'ARIA-7' | 'NOVA' | 'HELIX-3' | 'CIPHER'
export type NewsCategory = 'BREAKING' | 'MARKET' | 'GEOPOLITICAL' | 'ANALYSIS' | 'PREDICTION'
export type NewsSentiment = 'bullish' | 'bearish' | 'neutral'
export type MarketMood = 'RISK-ON' | 'RISK-OFF' | 'NEUTRAL' | 'VOLATILE'

export interface NewsItem {
  id: string
  anchor: NewsAnchor
  category: NewsCategory
  ticker: string
  headline: string
  body: string
  sentiment: NewsSentiment
  affectedSymbols: string[]
  impact: string
}

export interface CommodityForecast {
  outlook: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  rationale: string
  shortTarget: string
  longTarget: string
  risk: string
}

export interface NewsGenerateRequest {
  spotPrices: Record<string, number>
  basePrices: Record<string, number>
  priceChanges: Record<string, number>
  recentTrades: {
    commoditySymbol: string
    qty: number
    price: number
    buyerName: string
    sellerName: string
  }[]
  activeSanctions: { issuer: string; target: string; commodity: string }[]
  activeAlliances: { a: string; b: string }[]
  recentCyberAttacks: { attacker: string; target: string; type: string; status: string }[]
  worldEvents: { headline: string; type: string }[]
  leaderboard: { name: string; flag: string; gdpScore: number }[]
  playerCountry: string
}

export interface NewsGenerateSuccess {
  ok: true
  items: NewsItem[]
  marketMood: MarketMood
  moodReason: string
  forecasts: Record<string, CommodityForecast>
}

export interface NewsGenerateFailure {
  ok: false
  error: { code: string; message: string; retryable: boolean }
}

export type NewsGenerateResponse = NewsGenerateSuccess | NewsGenerateFailure
