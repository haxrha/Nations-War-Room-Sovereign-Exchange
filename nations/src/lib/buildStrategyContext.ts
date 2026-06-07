import type { GameContextValue } from '../context/GameContext'
import type { StrategyGameSnapshot } from './strategy-api-types'
import { buildBotSnapshot } from '../bots/buildSnapshot'

export function buildStrategyContext(
  game: Pick<
    GameContextValue,
    | 'playerCountryId'
    | 'playerCountry'
    | 'countries'
    | 'commodities'
    | 'resources'
    | 'spotPrices'
    | 'offers'
    | 'tradeHistory'
  >,
): StrategyGameSnapshot | null {
  const snapshot = buildBotSnapshot(game, 0)
  if (!snapshot) return null

  const cheapestOffersBySymbol: StrategyGameSnapshot['cheapestOffersBySymbol'] = {}
  for (const sym of Object.keys(snapshot.spotPrices)) {
    const offers = snapshot.openOffers
      .filter((o) => o.commoditySymbol === sym && !o.isMine)
      .sort((a, b) => a.pricePerUnit - b.pricePerUnit)
    const best = offers[0]
    if (best) {
      cheapestOffersBySymbol[sym] = {
        pricePerUnit: best.pricePerUnit,
        qty: best.qty,
        sellerIsBot: best.sellerIsBot,
      }
    }
  }

  return {
    tick: snapshot.tick,
    myCountry: {
      name: snapshot.myCountry.name,
      balance: snapshot.myCountry.balance,
      gdpScore: snapshot.myCountry.gdpScore,
      resources: snapshot.myCountry.resources,
    },
    spotPrices: snapshot.spotPrices,
    commodities: snapshot.commodities,
    openOffersCount: snapshot.openOffers.length,
    myOpenOffersCount: snapshot.openOffers.filter((o) => o.isMine).length,
    cheapestOffersBySymbol,
  }
}
