import type { GameContextValue } from '../context/GameContext'
import type { NewsGenerateRequest } from './news-types'
import { getCountry, getCommodity } from './utils'

export function buildNewsContext(
  game: Pick<
    GameContextValue,
    | 'playerCountry'
    | 'countries'
    | 'commodities'
    | 'spotPrices'
    | 'tradeHistory'
    | 'activeSanctions'
    | 'activeAlliances'
    | 'cyberAttacks'
    | 'worldEvents'
    | 'now'
  >,
): NewsGenerateRequest {
  const spotPrices: Record<string, number> = {}
  const basePrices: Record<string, number> = {}
  const priceChanges: Record<string, number> = {}

  for (const spot of game.spotPrices) {
    const comm = getCommodity(spot.commodityId, game.commodities)
    if (!comm) continue
    spotPrices[comm.symbol] = spot.price
    basePrices[comm.symbol] = comm.basePrice
    priceChanges[comm.symbol] = comm.basePrice > 0
      ? ((spot.price - comm.basePrice) / comm.basePrice) * 100
      : 0
  }

  const thirtySecondsAgo = game.now - 30_000
  const recentTrades = game.tradeHistory
    .filter((t) => Number(t.filledAt.microsSinceUnixEpoch / 1000n) > thirtySecondsAgo)
    .slice(0, 10)
    .map((t) => {
      const comm = getCommodity(t.commodityId, game.commodities)
      const buyer = getCountry(t.buyerId, game.countries)
      const seller = getCountry(t.sellerId, game.countries)
      return {
        commoditySymbol: comm?.symbol ?? '?',
        qty: t.qty,
        price: t.price,
        buyerName: buyer?.name ?? 'Unknown',
        sellerName: seller?.name ?? 'Unknown',
      }
    })

  const activeSanctions = game.activeSanctions.slice(0, 5).map((s) => {
    const issuer = getCountry(s.issuerCountryId, game.countries)
    const target = getCountry(s.targetCountryId, game.countries)
    const comm = getCommodity(s.commodityId, game.commodities)
    return {
      issuer: issuer?.name ?? '?',
      target: target?.name ?? '?',
      commodity: s.commodityId === 0n ? 'all' : (comm?.symbol ?? '?'),
    }
  })

  const activeAlliances = game.activeAlliances.slice(0, 5).map((a) => {
    const proposer = getCountry(a.proposerId, game.countries)
    const partner = getCountry(a.partnerId, game.countries)
    return { a: proposer?.name ?? '?', b: partner?.name ?? '?' }
  })

  const recentCyberAttacks = game.cyberAttacks.slice(0, 5).map((a) => {
    const attacker = getCountry(a.attackerId, game.countries)
    const target = getCountry(a.targetId, game.countries)
    return {
      attacker: attacker?.name ?? '?',
      target: target?.name ?? '?',
      type: a.attackType,
      status: a.status,
    }
  })

  const worldEvents = game.worldEvents
    .filter((e) => e.active)
    .map((e) => ({ headline: e.headline, type: e.eventType }))

  const leaderboard = [...game.countries]
    .sort((a, b) => b.gdpScore - a.gdpScore)
    .slice(0, 5)
    .map((c) => ({ name: c.name, flag: c.flag, gdpScore: Math.round(c.gdpScore) }))

  return {
    spotPrices,
    basePrices,
    priceChanges,
    recentTrades,
    activeSanctions,
    activeAlliances,
    recentCyberAttacks,
    worldEvents,
    leaderboard,
    playerCountry: game.playerCountry?.name ?? 'Observer',
  }
}
