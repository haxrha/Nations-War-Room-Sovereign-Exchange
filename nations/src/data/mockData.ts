import type {
  Commodity,
  CompletedTrade,
  Country,
  ResourceStock,
  SpotPrice,
  TradeOffer,
  TradeRoute,
} from '../types'

export const COMMODITIES: Commodity[] = [
  { id: 'oil', name: 'Crude Oil', symbol: 'OIL', basePrice: 78, unit: 'bbl', color: '#f59e0b' },
  { id: 'steel', name: 'Steel', symbol: 'STL', basePrice: 620, unit: 't', color: '#94a3b8' },
  { id: 'grain', name: 'Grain', symbol: 'GRN', basePrice: 245, unit: 't', color: '#eab308' },
  { id: 'electronics', name: 'Electronics', symbol: 'ELC', basePrice: 1200, unit: 'unit', color: '#60a5fa' },
  { id: 'rare_earths', name: 'Rare Earths', symbol: 'REE', basePrice: 4500, unit: 'kg', color: '#a855f7' },
]

export const COUNTRIES: Country[] = [
  { id: 'usa', name: 'United States', flag: '🇺🇸', lat: 38.9, lng: -77.0, region: 'North America', isBot: false, personality: 'balanced', balance: 2_400_000_000, exports: ['grain', 'electronics', 'oil'] },
  { id: 'chn', name: 'China', flag: '🇨🇳', lat: 39.9, lng: 116.4, region: 'East Asia', isBot: true, personality: 'undercut', balance: 2_100_000_000, exports: ['electronics', 'steel', 'rare_earths'] },
  { id: 'deu', name: 'Germany', flag: '🇩🇪', lat: 52.5, lng: 13.4, region: 'Europe', isBot: true, personality: 'protect_manufacturing', balance: 1_800_000_000, exports: ['steel', 'electronics'] },
  { id: 'sau', name: 'Saudi Arabia', flag: '🇸🇦', lat: 24.7, lng: 46.7, region: 'Middle East', isBot: true, personality: 'flood_oil', balance: 1_600_000_000, exports: ['oil'] },
  { id: 'bra', name: 'Brazil', flag: '🇧🇷', lat: -15.8, lng: -47.9, region: 'South America', isBot: true, personality: 'export_aggressive', balance: 900_000_000, exports: ['grain', 'steel'] },
  { id: 'jpn', name: 'Japan', flag: '🇯🇵', lat: 35.7, lng: 139.7, region: 'East Asia', isBot: true, personality: 'import_focused', balance: 1_400_000_000, exports: ['electronics'] },
  { id: 'ind', name: 'India', flag: '🇮🇳', lat: 28.6, lng: 77.2, region: 'South Asia', isBot: true, personality: 'balanced', balance: 1_100_000_000, exports: ['grain', 'electronics'] },
  { id: 'aus', name: 'Australia', flag: '🇦🇺', lat: -35.3, lng: 149.1, region: 'Oceania', isBot: true, personality: 'export_aggressive', balance: 850_000_000, exports: ['grain', 'rare_earths', 'oil'] },
]

export const INITIAL_RESOURCES: ResourceStock[] = [
  { countryId: 'usa', commodityId: 'grain', qty: 45_000_000 },
  { countryId: 'usa', commodityId: 'electronics', qty: 8_000_000 },
  { countryId: 'usa', commodityId: 'oil', qty: 12_000_000 },
  { countryId: 'chn', commodityId: 'electronics', qty: 22_000_000 },
  { countryId: 'chn', commodityId: 'steel', qty: 35_000_000 },
  { countryId: 'chn', commodityId: 'rare_earths', qty: 180_000 },
  { countryId: 'deu', commodityId: 'steel', qty: 18_000_000 },
  { countryId: 'deu', commodityId: 'electronics', qty: 6_000_000 },
  { countryId: 'sau', commodityId: 'oil', qty: 55_000_000 },
  { countryId: 'bra', commodityId: 'grain', qty: 28_000_000 },
  { countryId: 'bra', commodityId: 'steel', qty: 5_000_000 },
  { countryId: 'jpn', commodityId: 'electronics', qty: 9_000_000 },
  { countryId: 'jpn', commodityId: 'steel', qty: 2_000_000 },
  { countryId: 'ind', commodityId: 'grain', qty: 32_000_000 },
  { countryId: 'ind', commodityId: 'electronics', qty: 4_000_000 },
  { countryId: 'aus', commodityId: 'grain', qty: 15_000_000 },
  { countryId: 'aus', commodityId: 'rare_earths', qty: 95_000 },
  { countryId: 'aus', commodityId: 'oil', qty: 3_000_000 },
]

function makeSpotPrices(): SpotPrice[] {
  const now = Date.now()
  const prices: SpotPrice[] = []
  for (const country of COUNTRIES) {
    for (const commodity of COMMODITIES) {
      const isExport = country.exports.includes(commodity.id)
      const variance = (Math.random() - 0.5) * commodity.basePrice * 0.08
      const exportDiscount = isExport ? -commodity.basePrice * 0.03 : commodity.basePrice * 0.05
      const price = commodity.basePrice + exportDiscount + variance
      prices.push({ id: `spot-${country.id}-${commodity.id}`, countryId: country.id, commodityId: commodity.id, price: Math.round(price * 100) / 100, prevPrice: price, updatedAt: now })
    }
  }
  return prices
}

export const INITIAL_OFFERS: TradeOffer[] = [
  { id: 'offer-1', fromCountryId: 'sau', commodityId: 'oil', qty: 500_000, pricePerUnit: 74.5, type: 'sell', status: 'open', createdAt: Date.now() - 45_000 },
  { id: 'offer-2', fromCountryId: 'chn', commodityId: 'electronics', qty: 200_000, pricePerUnit: 1120, type: 'sell', status: 'open', createdAt: Date.now() - 30_000 },
  { id: 'offer-3', fromCountryId: 'jpn', commodityId: 'oil', qty: 1_000_000, pricePerUnit: 76, type: 'buy', status: 'open', createdAt: Date.now() - 20_000 },
  { id: 'offer-4', fromCountryId: 'deu', commodityId: 'steel', qty: 50_000, pricePerUnit: 645, type: 'sell', status: 'open', createdAt: Date.now() - 15_000 },
  { id: 'offer-5', fromCountryId: 'bra', commodityId: 'grain', qty: 800_000, pricePerUnit: 232, type: 'sell', status: 'open', createdAt: Date.now() - 10_000 },
]

export const INITIAL_TRADES: CompletedTrade[] = [
  { id: 'trade-1', sellerId: 'aus', buyerId: 'jpn', commodityId: 'rare_earths', qty: 5000, totalPrice: 22_500_000, filledAt: Date.now() - 90_000 },
]

export function createInitialState() {
  const now = Date.now()
  const spotPrices = makeSpotPrices()
  const priceHistory: Record<string, { timestamp: number; price: number }[]> = {}
  for (const spot of spotPrices) {
    const key = `${spot.countryId}-${spot.commodityId}`
    priceHistory[key] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: now - (10 - i) * 6000,
      price: spot.price + (Math.random() - 0.5) * spot.price * 0.02,
    }))
  }
  return {
    countries: COUNTRIES.map((c) => ({ ...c })),
    resources: INITIAL_RESOURCES.map((r) => ({ ...r })),
    spotPrices,
    offers: INITIAL_OFFERS.map((o) => ({ ...o })),
    routes: [] as TradeRoute[],
    completedTrades: INITIAL_TRADES.map((t) => ({ ...t })),
    priceHistory,
    playerCountryId: 'usa',
    selectedCommodityId: 'oil',
    tickCount: 0,
    lastBotAction: '',
  }
}

export type GameState = ReturnType<typeof createInitialState>
