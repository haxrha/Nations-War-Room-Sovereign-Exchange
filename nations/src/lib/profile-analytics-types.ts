export type ProfileHolding = {
  symbol: string
  name: string
  unit: string
  qty: number
  productionRate: number
  spotPrice: number
  basePrice: number
  marketValue: number
  pctOfPortfolio: number
}

export type ProfileAnalyticsRequest = {
  player: {
    name: string
    flag: string
    isoCode: string
    region: string
  }
  cashBalance: number
  holdingsValue: number
  netWorth: number
  gdpScore: number
  globalRank: number
  totalNations: number
  holdings: ProfileHolding[]
  spotPrices: Record<string, number>
  openOffersCount: number
  myOpenOffersCount: number
  recentTrades: {
    symbol: string
    side: 'buy' | 'sell'
    qty: number
    price: number
    counterparty: string
    agoSec: number
  }[]
  activeSanctions: string[]
  priceTrends: Record<string, number[]>
  cheapestOffers: Record<string, { pricePerUnit: number; sellerName: string } | undefined>
}

export type ProfileMetric = {
  label: string
  value: string
  hint?: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

export type ProfileOpportunity = {
  commodity: string
  action: 'buy' | 'sell' | 'hold' | 'watch'
  rationale: string
}

export type ProfileAnalytics = {
  headline: string
  summary: string
  metrics: ProfileMetric[]
  opportunities: ProfileOpportunity[]
  risks: string[]
  watchlist: string[]
}

export type ProfileAnalyticsSuccess = {
  ok: true
  analytics: ProfileAnalytics
}

export type ProfileAnalyticsFailure = {
  ok: false
  error: { code: string; message: string; retryable: boolean }
}

export type ProfileAnalyticsResponse = ProfileAnalyticsSuccess | ProfileAnalyticsFailure
