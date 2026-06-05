import type { Contract, Order, Player, Port, Route, Ship, SpotPrice } from '../types'

export const COMMODITY = 'Iron Ore'

export const PORTS: Port[] = [
  {
    id: 'port-shanghai',
    name: 'Shanghai',
    lat: 31.23,
    lng: 121.47,
    region: 'Asia Pacific',
    commodity: COMMODITY,
    basePrice: 92,
    congestion: 0.35,
    capacity: 100,
  },
  {
    id: 'port-rotterdam',
    name: 'Rotterdam',
    lat: 51.92,
    lng: 4.48,
    region: 'Europe',
    commodity: COMMODITY,
    basePrice: 118,
    congestion: 0.22,
    capacity: 100,
  },
  {
    id: 'port-santos',
    name: 'Santos',
    lat: -23.96,
    lng: -46.33,
    region: 'Americas',
    commodity: COMMODITY,
    basePrice: 78,
    congestion: 0.18,
    capacity: 100,
  },
  {
    id: 'port-dubai',
    name: 'Dubai',
    lat: 25.2,
    lng: 55.27,
    region: 'Middle East',
    commodity: COMMODITY,
    basePrice: 105,
    congestion: 0.41,
    capacity: 100,
  },
  {
    id: 'port-singapore',
    name: 'Singapore',
    lat: 1.29,
    lng: 103.85,
    region: 'Asia Pacific',
    commodity: COMMODITY,
    basePrice: 98,
    congestion: 0.55,
    capacity: 100,
  },
  {
    id: 'port-houston',
    name: 'Houston',
    lat: 29.76,
    lng: -95.36,
    region: 'Americas',
    commodity: COMMODITY,
    basePrice: 88,
    congestion: 0.28,
    capacity: 100,
  },
]

export const PLAYERS: Player[] = [
  { id: 'player-1', name: 'Pacific Traders', balance: 500_000 },
  { id: 'player-2', name: 'Atlantic Freight Co', balance: 480_000 },
  { id: 'player-3', name: 'Orient Logistics', balance: 520_000 },
  { id: 'player-4', name: 'Nordic Shipping', balance: 495_000 },
]

export const INITIAL_SHIPS: Ship[] = [
  {
    id: 'ship-1',
    ownerId: 'player-1',
    name: 'Pacific Star',
    currentPortId: 'port-shanghai',
    cargoType: COMMODITY,
    cargoQty: 0,
    status: 'idle',
  },
  {
    id: 'ship-2',
    ownerId: 'player-1',
    name: 'Eastern Dawn',
    currentPortId: 'port-singapore',
    cargoType: COMMODITY,
    cargoQty: 5000,
    status: 'idle',
  },
  {
    id: 'ship-3',
    ownerId: 'player-2',
    name: 'Atlantic Voyager',
    currentPortId: 'port-rotterdam',
    cargoType: COMMODITY,
    cargoQty: 0,
    status: 'idle',
  },
  {
    id: 'ship-4',
    ownerId: 'player-2',
    name: 'North Sea',
    currentPortId: 'port-houston',
    cargoType: COMMODITY,
    cargoQty: 8000,
    status: 'idle',
  },
  {
    id: 'ship-5',
    ownerId: 'player-3',
    name: 'Orient Express',
    currentPortId: 'port-dubai',
    cargoType: COMMODITY,
    cargoQty: 0,
    status: 'idle',
  },
]

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'route-1',
    shipId: 'ship-5',
    originPortId: 'port-santos',
    destPortId: 'port-dubai',
    departedAt: Date.now() - 45_000,
    eta: Date.now() + 75_000,
    status: 'in_transit',
  },
]

export const INITIAL_SPOT_PRICES: SpotPrice[] = PORTS.map((port) => ({
  id: `spot-${port.id}`,
  portId: port.id,
  commodity: COMMODITY,
  price: port.basePrice + (Math.random() - 0.5) * 6,
  updatedAt: Date.now(),
}))

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-1',
    playerId: 'player-2',
    portId: 'port-rotterdam',
    commodity: COMMODITY,
    qty: 2000,
    bidPrice: 121.5,
    side: 'buy',
    createdAt: Date.now() - 30_000,
  },
  {
    id: 'order-2',
    playerId: 'player-3',
    portId: 'port-rotterdam',
    commodity: COMMODITY,
    qty: 1500,
    bidPrice: 119.0,
    side: 'buy',
    createdAt: Date.now() - 25_000,
  },
  {
    id: 'order-3',
    playerId: 'player-4',
    portId: 'port-rotterdam',
    commodity: COMMODITY,
    qty: 3000,
    bidPrice: 124.0,
    side: 'sell',
    createdAt: Date.now() - 20_000,
  },
  {
    id: 'order-4',
    playerId: 'player-1',
    portId: 'port-shanghai',
    commodity: COMMODITY,
    qty: 4000,
    bidPrice: 89.5,
    side: 'sell',
    createdAt: Date.now() - 15_000,
  },
  {
    id: 'order-5',
    playerId: 'player-3',
    portId: 'port-shanghai',
    commodity: COMMODITY,
    qty: 2500,
    bidPrice: 91.0,
    side: 'buy',
    createdAt: Date.now() - 10_000,
  },
  {
    id: 'order-6',
    playerId: 'player-2',
    portId: 'port-santos',
    commodity: COMMODITY,
    qty: 5000,
    bidPrice: 76.0,
    side: 'buy',
    createdAt: Date.now() - 8_000,
  },
  {
    id: 'order-7',
    playerId: 'player-4',
    portId: 'port-santos',
    commodity: COMMODITY,
    qty: 3500,
    bidPrice: 79.5,
    side: 'sell',
    createdAt: Date.now() - 5_000,
  },
]

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'contract-1',
    buyerId: 'player-2',
    sellerId: 'player-1',
    commodity: COMMODITY,
    qty: 1000,
    price: 93.5,
    portId: 'port-shanghai',
    filledAt: Date.now() - 120_000,
  },
]

export function createInitialState() {
  const ships = INITIAL_SHIPS.map((s) =>
    s.id === 'ship-5'
      ? { ...s, status: 'in_transit' as const, currentPortId: 'port-santos' }
      : { ...s },
  )

  const now = Date.now()
  const priceHistory: Record<string, { timestamp: number; price: number }[]> = {}
  for (const spot of INITIAL_SPOT_PRICES) {
    priceHistory[spot.portId] = Array.from({ length: 8 }, (_, i) => ({
      timestamp: now - (8 - i) * 8000,
      price: spot.price + (Math.random() - 0.5) * 3,
    }))
  }

  return {
    ports: PORTS.map((p) => ({ ...p })),
    players: PLAYERS.map((p) => ({ ...p })),
    ships,
    routes: INITIAL_ROUTES.map((r) => ({ ...r })),
    spotPrices: INITIAL_SPOT_PRICES.map((s) => ({ ...s })),
    orders: INITIAL_ORDERS.map((o) => ({ ...o })),
    contracts: INITIAL_CONTRACTS.map((c) => ({ ...c })),
    priceHistory,
    tickCount: 0,
  }
}

export type GameState = ReturnType<typeof createInitialState>
