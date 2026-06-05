export type OrderSide = 'buy' | 'sell'
export type RouteStatus = 'pending' | 'in_transit' | 'arrived'
export type ShipStatus = 'idle' | 'loading' | 'in_transit'

export interface Port {
  id: string
  name: string
  lat: number
  lng: number
  region: string
  commodity: string
  basePrice: number
  congestion: number
  capacity: number
}

export interface Player {
  id: string
  name: string
  balance: number
}

export interface Ship {
  id: string
  ownerId: string
  name: string
  currentPortId: string
  cargoType: string
  cargoQty: number
  status: ShipStatus
}

export interface Route {
  id: string
  shipId: string
  originPortId: string
  destPortId: string
  departedAt: number
  eta: number
  status: RouteStatus
}

export interface SpotPrice {
  id: string
  portId: string
  commodity: string
  price: number
  updatedAt: number
}

export interface Order {
  id: string
  playerId: string
  portId: string
  commodity: string
  qty: number
  bidPrice: number
  side: OrderSide
  createdAt: number
}

export interface Contract {
  id: string
  buyerId: string
  sellerId: string
  commodity: string
  qty: number
  price: number
  portId: string
  filledAt: number
}

export interface PriceTick {
  timestamp: number
  price: number
}

export interface ShipPosition {
  shipId: string
  shipName: string
  ownerId: string
  lat: number
  lng: number
  cargoType: string
  destPortName: string
  progress: number
}
