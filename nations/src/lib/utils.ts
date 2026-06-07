import type { Infer } from 'spacetimedb'
import type CountryRow from '../module_bindings/country_table'
import type CommodityRow from '../module_bindings/commodity_table'
import type SpotPriceRow from '../module_bindings/spot_price_table'
import type CountryResourceRow from '../module_bindings/country_resource_table'
import { commodityColor } from './design-system'

export type Country = Infer<typeof CountryRow>
export type Commodity = Infer<typeof CommodityRow>
export type SpotPrice = Infer<typeof SpotPriceRow>
export type CountryResource = Infer<typeof CountryResourceRow>

export function idStr(id: bigint): string {
  return id.toString()
}

export function getCountry(id: bigint, countries: readonly Country[]): Country | undefined {
  return countries.find((c) => c.id === id)
}

export function getCommodity(id: bigint, commodities: readonly Commodity[]): Commodity | undefined {
  return commodities.find((c) => c.id === id)
}

export function getResource(
  countryId: bigint,
  commodityId: bigint,
  resources: readonly CountryResource[],
): number {
  return (
    resources.find((r) => r.countryId === countryId && r.commodityId === commodityId)?.qty ?? 0
  )
}

export function formatMoney(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatQty(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString('en-US')
}

export function formatPrice(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatTimeAgo(micros: bigint, nowMs: number): string {
  const tsMs = Number(micros / 1000n)
  const sec = Math.floor((nowMs - tsMs) / 1000)
  if (sec < 60) return `${sec}s ago`
  return `${Math.floor(sec / 60)}m ago`
}

export function computeRankings(countries: readonly Country[]) {
  return [...countries]
    .sort((a, b) => b.gdpScore - a.gdpScore)
    .map((c, i) => ({ countryId: c.id, gdpScore: c.gdpScore, rank: i + 1 }))
}

export function botStrategyLabel(strategy: string): string {
  return strategy.replace(/_/g, ' ') || 'neutral'
}

export function commodityAccent(commodity: Commodity | undefined): string {
  return commodity ? commodityColor(commodity.symbol) : '#5E6AD2'
}

export interface PricePoint {
  timestamp: number
  price: number
  /** SpacetimeDB spot_price.updated_at — one point per server tick */
  serverTick?: string
}

export function priceChange(current: number, previous: number) {
  const delta = current - previous
  const pct = previous > 0 ? (delta / previous) * 100 : 0
  const direction = delta > 0.01 ? ('up' as const) : delta < -0.01 ? ('down' as const) : ('flat' as const)
  return { delta, pct, direction }
}

export type SanctionLike = {
  issuerCountryId: bigint
  targetCountryId: bigint
  commodityId: bigint
  active: boolean
}

export function isTradeSanctioned(
  sanctions: readonly SanctionLike[],
  partyA: bigint,
  partyB: bigint,
  commodityId: bigint,
): boolean {
  if (partyA === partyB) return false
  for (const s of sanctions) {
    if (!s.active) continue
    const commOk = s.commodityId === 0n || s.commodityId === commodityId
    if (!commOk) continue
    if (
      (s.issuerCountryId === partyA && s.targetCountryId === partyB) ||
      (s.issuerCountryId === partyB && s.targetCountryId === partyA)
    ) {
      return true
    }
  }
  return false
}
