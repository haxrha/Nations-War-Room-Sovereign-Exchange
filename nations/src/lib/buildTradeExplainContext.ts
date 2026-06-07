import type { GameContextValue } from '../context/GameContext'
import type { TradeOffer } from '../context/GameContext'
import type { ExplainTradeRequest } from './trade-explain-types'
import { getCommodity, getCountry, idStr } from './utils'

export function buildTradeExplainRequest(
  offer: TradeOffer,
  game: Pick<
    GameContextValue,
    | 'playerCountry'
    | 'countries'
    | 'commodities'
    | 'spotPrices'
    | 'tradeHistory'
    | 'activeSanctions'
    | 'offers'
    | 'priceHistory'
    | 'now'
  >,
): ExplainTradeRequest | null {
  const player = game.playerCountry
  if (!player) return null

  const commodity = getCommodity(offer.commodityId, game.commodities)
  const seller = getCountry(offer.sellerId, game.countries)
  if (!commodity || !seller) return null

  const spot = game.spotPrices.find((s) => s.commodityId === offer.commodityId)
  const spotPrice = spot?.price ?? commodity.basePrice
  const totalCost = offer.qty * offer.pricePerUnit
  const priceVsSpotPct = spotPrice > 0 ? ((offer.pricePerUnit - spotPrice) / spotPrice) * 100 : 0
  const priceVsBasePct =
    commodity.basePrice > 0
      ? ((offer.pricePerUnit - commodity.basePrice) / commodity.basePrice) * 100
      : 0

  const spotPrices: Record<string, number> = {}
  for (const c of game.commodities) {
    const s = game.spotPrices.find((p) => p.commodityId === c.id)
    spotPrices[c.symbol] = s?.price ?? c.basePrice
  }

  const sanctionsAffectingTrade = game.activeSanctions
    .filter(
      (s) =>
        s.commodityId === offer.commodityId &&
        (s.issuerCountryId === player.id || s.targetCountryId === player.id),
    )
    .map((s) => {
      const issuer = getCountry(s.issuerCountryId, game.countries)
      const target = getCountry(s.targetCountryId, game.countries)
      return `${issuer?.name ?? '?'} → ${target?.name ?? '?'}: ${s.reason}`
    })

  const recentSameCommodityTrades = game.tradeHistory
    .filter((t) => t.commodityId === offer.commodityId)
    .slice(0, 8)
    .map((t) => {
      const tsMs = Number(t.filledAt.microsSinceUnixEpoch / 1000n)
      return {
        price: t.price,
        qty: t.qty,
        sellerName: getCountry(t.sellerId, game.countries)?.name ?? '?',
        buyerName: getCountry(t.buyerId, game.countries)?.name ?? '?',
        agoSec: Math.max(0, Math.floor((game.now - tsMs) / 1000)),
      }
    })

  const historyKey = idStr(offer.commodityId)
  const priceTrend = (game.priceHistory[historyKey] ?? []).slice(-12).map((p) => p.price)

  const sameCommodityOffers = game.offers.filter(
    (o) => o.commodityId === offer.commodityId && o.sellerId !== player.id,
  )
  const cheapest = sameCommodityOffers.reduce<number | undefined>((min, o) => {
    if (min == null || o.pricePerUnit < min) return o.pricePerUnit
    return min
  }, undefined)

  return {
    trade: {
      commoditySymbol: commodity.symbol,
      commodityName: commodity.name,
      commodityUnit: commodity.unit,
      qty: offer.qty,
      pricePerUnit: offer.pricePerUnit,
      totalCost,
      sellerName: seller.name,
      sellerFlag: seller.flag,
      sellerIsBot: seller.isBot,
      side: 'buy',
    },
    gameContext: {
      playerCountryName: player.name,
      playerBalanceBefore: player.balance,
      spotPrice,
      basePrice: commodity.basePrice,
      priceVsSpotPct,
      priceVsBasePct,
      spotPrices,
      activeSanctionsCount: game.activeSanctions.length,
      sanctionsAffectingTrade,
      recentSameCommodityTrades,
      priceTrend,
      openOffersSameCommodity: sameCommodityOffers.length,
      cheapestOfferSameCommodity: cheapest,
    },
  }
}
