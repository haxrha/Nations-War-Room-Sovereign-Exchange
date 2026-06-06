import type { GameContextValue } from '../context/GameContext'
import { getCommodity, getCountry, getResource, idStr } from '../lib/utils'
import type { BotGameState } from './types'

export function buildBotSnapshot(
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
  tick: number,
): BotGameState | null {
  const { playerCountryId, playerCountry } = game
  if (playerCountryId == null || !playerCountry) return null

  const resources: Record<string, number> = {}
  for (const c of game.commodities) {
    const qty = getResource(playerCountryId, c.id, game.resources)
    if (qty > 0) resources[c.symbol] = qty
  }

  const spotPrices: Record<string, number> = {}
  for (const spot of game.spotPrices) {
    const comm = getCommodity(spot.commodityId, game.commodities)
    if (comm) spotPrices[comm.symbol] = spot.price
  }

  return {
    tick,
    myCountry: {
      id: idStr(playerCountryId),
      name: playerCountry.name,
      balance: playerCountry.balance,
      gdpScore: playerCountry.gdpScore,
      resources,
    },
    spotPrices,
    commodities: game.commodities.map((c) => ({
      id: idStr(c.id),
      symbol: c.symbol,
      name: c.name,
      unit: c.unit,
    })),
    openOffers: game.offers.map((o) => {
      const seller = getCountry(o.sellerId, game.countries)
      const comm = getCommodity(o.commodityId, game.commodities)
      return {
        id: idStr(o.id),
        sellerId: idStr(o.sellerId),
        sellerName: seller?.name ?? '?',
        sellerIsBot: seller?.isBot ?? false,
        commodityId: idStr(o.commodityId),
        commoditySymbol: comm?.symbol ?? '?',
        qty: o.qty,
        pricePerUnit: o.pricePerUnit,
        totalCost: o.qty * o.pricePerUnit,
        isMine: o.sellerId === playerCountryId,
      }
    }),
    tradeHistory: game.tradeHistory.slice(0, 20).map((t) => {
      const comm = getCommodity(t.commodityId, game.commodities)
      return {
        commoditySymbol: comm?.symbol ?? '?',
        qty: t.qty,
        price: t.price,
        buyerId: idStr(t.buyerId),
        sellerId: idStr(t.sellerId),
        filledAt: Number(t.filledAt.microsSinceUnixEpoch / 1000n),
      }
    }),
  }
}
