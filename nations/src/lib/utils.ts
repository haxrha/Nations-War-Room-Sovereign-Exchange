import { COMMODITIES, COUNTRIES, type GameState } from '../data/mockData'
import type { Commodity, Country, ResourceStock, SpotPrice } from '../types'

export function getCountry(id: string, countries: Country[]): Country | undefined {
  return countries.find((c) => c.id === id)
}

export function getCommodity(id: string): Commodity | undefined {
  return COMMODITIES.find((c) => c.id === id)
}

export function getResource(countryId: string, commodityId: string, resources: ResourceStock[]): number {
  return resources.find((r) => r.countryId === countryId && r.commodityId === commodityId)?.qty ?? 0
}

export function formatMoney(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function formatQty(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString('en-US')
}

export function formatPrice(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatTimeAgo(ts: number, now: number): string {
  const sec = Math.floor((now - ts) / 1000)
  if (sec < 60) return `${sec}s ago`
  return `${Math.floor(sec / 60)}m ago`
}

export function computeGdpProxy(countryId: string, state: Pick<GameState, 'countries' | 'resources' | 'spotPrices'>): number {
  const country = getCountry(countryId, state.countries)
  if (!country) return 0
  const resourceValue = state.resources
    .filter((r) => r.countryId === countryId)
    .reduce((sum, r) => {
      const spot = state.spotPrices.find((s) => s.countryId === countryId && s.commodityId === r.commodityId)
      const price = spot?.price ?? getCommodity(r.commodityId)?.basePrice ?? 0
      return sum + r.qty * price
    }, 0)
  return country.balance + resourceValue
}

export function computeRankings(state: Pick<GameState, 'countries' | 'resources' | 'spotPrices'>) {
  return state.countries
    .map((c) => ({ countryId: c.id, gdpProxy: computeGdpProxy(c.id, state) }))
    .sort((a, b) => b.gdpProxy - a.gdpProxy)
    .map((entry, i) => ({ ...entry, rank: i + 1 }))
}

export function interpolateRoute(from: Country, to: Country, progress: number): { lat: number; lng: number } {
  const t = Math.min(1, Math.max(0, progress))
  return { lat: from.lat + (to.lat - from.lat) * t, lng: from.lng + (to.lng - from.lng) * t }
}

export function priceChange(spot: SpotPrice) {
  const delta = spot.price - spot.prevPrice
  const pct = spot.prevPrice > 0 ? (delta / spot.prevPrice) * 100 : 0
  const direction = delta > 0.01 ? 'up' as const : delta < -0.01 ? 'down' as const : 'flat' as const
  return { delta, pct, direction }
}

export { COMMODITIES, COUNTRIES }
