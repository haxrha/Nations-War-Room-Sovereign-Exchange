import type { GameContextValue } from '../context/GameContext'
import type { ProfileAnalyticsRequest, ProfileHolding } from './profile-analytics-types'
import { computeRankings, getCommodity, getResource, idStr } from './utils'

export type { ProfileAnalyticsRequest, ProfileHolding } from './profile-analytics-types'

export function buildProfileAnalyticsRequest(
  game: Pick<
    GameContextValue,
    | 'playerCountry'
    | 'playerCountryId'
    | 'countries'
    | 'commodities'
    | 'resources'
    | 'spotPrices'
    | 'offers'
    | 'tradeHistory'
    | 'activeSanctions'
    | 'priceHistory'
    | 'now'
  >,
): ProfileAnalyticsRequest | null {
  const player = game.playerCountry
  const playerId = game.playerCountryId
  if (!player || playerId == null) return null

  const rankings = computeRankings(game.countries)
  const rankEntry = rankings.find((r) => r.countryId === playerId)
  const globalRank = rankEntry?.rank ?? game.countries.length

  let holdingsValue = 0
  const holdings: ProfileHolding[] = game.commodities.map((c) => {
    const qty = getResource(playerId, c.id, game.resources)
    const spot = game.spotPrices.find((s) => s.commodityId === c.id)
    const spotPrice = spot?.price ?? c.basePrice
    const row = game.resources.find((r) => r.countryId === playerId && r.commodityId === c.id)
    const marketValue = qty * spotPrice
    holdingsValue += marketValue
    return {
      symbol: c.symbol,
      name: c.name,
      unit: c.unit,
      qty,
      productionRate: row?.productionRate ?? 0,
      spotPrice,
      basePrice: c.basePrice,
      marketValue,
      pctOfPortfolio: 0,
    }
  })

  const netWorth = player.balance + holdingsValue
  for (const h of holdings) {
    h.pctOfPortfolio = netWorth > 0 ? (h.marketValue / netWorth) * 100 : 0
  }

  const spotPrices: Record<string, number> = {}
  for (const c of game.commodities) {
    const spot = game.spotPrices.find((s) => s.commodityId === c.id)
    spotPrices[c.symbol] = spot?.price ?? c.basePrice
  }

  const recentTrades = game.tradeHistory.slice(0, 10).flatMap((t) => {
    const commodity = getCommodity(t.commodityId, game.commodities)
    if (!commodity) return []
    const isBuy = t.buyerId === playerId
    const counterId = isBuy ? t.sellerId : t.buyerId
    const counter = game.countries.find((c) => c.id === counterId)
    const tsMs = Number(t.filledAt.microsSinceUnixEpoch / 1000n)
    return [
      {
        symbol: commodity.symbol,
        side: isBuy ? ('buy' as const) : ('sell' as const),
        qty: t.qty,
        price: t.price,
        counterparty: counter?.name ?? '?',
        agoSec: Math.max(0, Math.floor((game.now - tsMs) / 1000)),
      },
    ]
  })

  const activeSanctions = game.activeSanctions
    .filter((s) => s.issuerCountryId === playerId || s.targetCountryId === playerId)
    .map((s) => {
      const issuer = game.countries.find((c) => c.id === s.issuerCountryId)
      const target = game.countries.find((c) => c.id === s.targetCountryId)
      const comm = getCommodity(s.commodityId, game.commodities)
      return `${issuer?.name ?? '?'} → ${target?.name ?? '?'} (${comm?.symbol ?? '?'})`
    })

  const priceTrends: Record<string, number[]> = {}
  for (const c of game.commodities) {
    priceTrends[c.symbol] = (game.priceHistory[idStr(c.id)] ?? [])
      .slice(-12)
      .map((p) => p.price)
  }

  const cheapestOffers: ProfileAnalyticsRequest['cheapestOffers'] = {}
  for (const c of game.commodities) {
    const best = game.offers
      .filter((o) => o.sellerId !== playerId && o.commodityId === c.id)
      .sort((a, b) => a.pricePerUnit - b.pricePerUnit)[0]
    if (best) {
      const seller = game.countries.find((co) => co.id === best.sellerId)
      cheapestOffers[c.symbol] = {
        pricePerUnit: best.pricePerUnit,
        sellerName: seller?.name ?? '?',
      }
    }
  }

  return {
    player: {
      name: player.name,
      flag: player.flag,
      isoCode: player.isoCode,
      region: player.region,
    },
    cashBalance: player.balance,
    holdingsValue,
    netWorth,
    gdpScore: player.gdpScore,
    globalRank,
    totalNations: game.countries.length,
    holdings,
    spotPrices,
    openOffersCount: game.offers.length,
    myOpenOffersCount: game.offers.filter((o) => o.sellerId === playerId).length,
    recentTrades,
    activeSanctions,
    priceTrends,
    cheapestOffers,
  }
}
