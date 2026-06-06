export type BotPersonality =
  | 'balanced'
  | 'undercut'
  | 'protect_manufacturing'
  | 'flood_oil'
  | 'export_aggressive'
  | 'import_focused'

export type OfferType = 'sell' | 'buy'
export type OfferStatus = 'open' | 'accepted' | 'cancelled'

export interface Commodity {
  id: string
  name: string
  symbol: string
  basePrice: number
  unit: string
  color: string
}

export interface Country {
  id: string
  name: string
  flag: string
  lat: number
  lng: number
  region: string
  isBot: boolean
  personality: BotPersonality
  balance: number
  exports: string[]
}

export interface ResourceStock {
  countryId: string
  commodityId: string
  qty: number
}

export interface SpotPrice {
  id: string
  countryId: string
  commodityId: string
  price: number
  prevPrice: number
  updatedAt: number
}

export interface TradeOffer {
  id: string
  fromCountryId: string
  commodityId: string
  qty: number
  pricePerUnit: number
  type: OfferType
  targetCountryId?: string
  status: OfferStatus
  createdAt: number
  acceptedBy?: string
  acceptedAt?: number
}

export interface TradeRoute {
  id: string
  fromCountryId: string
  toCountryId: string
  commodityId: string
  qty: number
  startedAt: number
  completesAt: number
}

export interface CompletedTrade {
  id: string
  sellerId: string
  buyerId: string
  commodityId: string
  qty: number
  totalPrice: number
  filledAt: number
}
