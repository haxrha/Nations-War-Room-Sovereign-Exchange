/** Serializable snapshot passed into the user bot each tick. */
export type BotGameState = {
  tick: number
  myCountry: {
    id: string
    name: string
    balance: number
    gdpScore: number
    resources: Record<string, number>
  }
  spotPrices: Record<string, number>
  commodities: { id: string; symbol: string; name: string; unit: string }[]
  openOffers: {
    id: string
    sellerId: string
    sellerName: string
    sellerIsBot: boolean
    commodityId: string
    commoditySymbol: string
    qty: number
    pricePerUnit: number
    totalCost: number
    isMine: boolean
  }[]
  tradeHistory: {
    commoditySymbol: string
    qty: number
    price: number
    buyerId: string
    sellerId: string
    filledAt: number
  }[]
}

export type BotAction =
  | { action: 'accept'; offerId: string }
  | { action: 'offer'; commodityId: string; qty: number; pricePerUnit: number }
  | { action: 'cancel'; offerId: string }

export type BotRunResult =
  | { ok: true; action: BotAction | null; logs?: string[] }
  | { ok: false; error: string }

export type BotStatus = {
  enabled: boolean
  lastTickAt: number | null
  lastAction: string | null
  lastError: string | null
  actionsThisSession: number
  startingGdp: number | null
}

export type BotSessionEntry = {
  id: string
  name: string
  actions: number
  startingGdp: number
  currentGdp: number
  pnl: number
  lastAction: string
  updatedAt: number
}
