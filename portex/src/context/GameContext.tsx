import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import { COMMODITY, createInitialState, type GameState } from '../data/mockData'
import { estimateTransitMs, getPort } from '../lib/utils'
import type { OrderSide } from '../types'

type GameAction =
  | { type: 'TICK_PRICES' }
  | { type: 'TICK_ARRIVALS'; now: number }
  | { type: 'MATCH_ORDERS'; now: number }
  | { type: 'DISPATCH_SHIP'; shipId: string; destPortId: string; now: number }
  | {
      type: 'PLACE_ORDER'
      playerId: string
      portId: string
      qty: number
      price: number
      side: OrderSide
      now: number
    }
  | { type: 'CANCEL_ORDER'; orderId: string; playerId: string }
  | { type: 'SET_PLAYER'; playerId: string }
  | { type: 'SELECT_PORT'; portId: string }

interface GameContextValue {
  state: GameState
  currentPlayerId: string
  selectedPortId: string
  dispatchShip: (shipId: string, destPortId: string) => void
  placeOrder: (
    portId: string,
    qty: number,
    price: number,
    side: OrderSide,
  ) => void
  cancelOrder: (orderId: string) => void
  setCurrentPlayer: (playerId: string) => void
  setSelectedPort: (portId: string) => void
  now: number
}

const GameContext = createContext<GameContextValue | null>(null)

let idCounter = 100

function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK_PRICES': {
      const tickCount = state.tickCount + 1
      const spotPrices = state.spotPrices.map((spot) => {
        const port = state.ports.find((p) => p.id === spot.portId)
        const portOrders = state.orders.filter((o) => o.portId === spot.portId)
        const buyPressure = portOrders
          .filter((o) => o.side === 'buy')
          .reduce((s, o) => s + o.qty, 0)
        const sellPressure = portOrders
          .filter((o) => o.side === 'sell')
          .reduce((s, o) => s + o.qty, 0)
        const imbalance = (buyPressure - sellPressure) / 10000
        const congestionDrift = (port?.congestion ?? 0) * 0.3
        const noise = (Math.random() - 0.5) * 1.2
        const anchor = port?.basePrice ?? spot.price
        const drift = imbalance * 2 + congestionDrift + noise
        const price = Math.max(50, Math.min(200, spot.price + drift * 0.15 + (anchor - spot.price) * 0.02))

        return {
          ...spot,
          price: Math.round(price * 100) / 100,
          updatedAt: Date.now(),
        }
      })

      const priceHistory = { ...state.priceHistory }
      for (const spot of spotPrices) {
        const key = spot.portId
        const history = [...(priceHistory[key] ?? []), { timestamp: spot.updatedAt, price: spot.price }]
        priceHistory[key] = history.slice(-20)
      }

      return { ...state, spotPrices, priceHistory, tickCount }
    }

    case 'TICK_ARRIVALS': {
      const { now } = action
      let ships = [...state.ships]
      let routes = [...state.routes]
      let ports = [...state.ports]

      for (const route of routes) {
        if (route.status !== 'in_transit' || route.eta > now) continue

        const shipIdx = ships.findIndex((s) => s.id === route.shipId)
        if (shipIdx === -1) continue

        const destPort = getPort(route.destPortId, ports)
        ships[shipIdx] = {
          ...ships[shipIdx],
          currentPortId: route.destPortId,
          status: 'idle',
        }

        routes = routes.map((r) =>
          r.id === route.id ? { ...r, status: 'arrived' as const } : r,
        )

        if (destPort) {
          ports = ports.map((p) =>
            p.id === destPort.id
              ? { ...p, congestion: Math.min(1, p.congestion + 0.08) }
              : p,
          )
        }
      }

      ports = ports.map((p) => ({
        ...p,
        congestion: Math.max(0.05, p.congestion - 0.01),
      }))

      return { ...state, ships, routes, ports }
    }

    case 'MATCH_ORDERS': {
      const { now } = action
      let orders = [...state.orders]
      let players = [...state.players]
      const contracts = [...state.contracts]

      const portIds = [...new Set(orders.map((o) => o.portId))]

      for (const portId of portIds) {
        const portOrders = orders.filter((o) => o.portId === portId)
        const buys = portOrders
          .filter((o) => o.side === 'buy')
          .sort((a, b) => b.bidPrice - a.bidPrice)
        const sells = portOrders
          .filter((o) => o.side === 'sell')
          .sort((a, b) => a.bidPrice - b.bidPrice)

        for (const buy of buys) {
          for (const sell of sells) {
            if (buy.bidPrice < sell.bidPrice) break
            if (buy.qty <= 0 || sell.qty <= 0) continue

            const fillQty = Math.min(buy.qty, sell.qty)
            const fillPrice = (buy.bidPrice + sell.bidPrice) / 2
            const total = fillQty * fillPrice

            contracts.unshift({
              id: nextId('contract'),
              buyerId: buy.playerId,
              sellerId: sell.playerId,
              commodity: buy.commodity,
              qty: fillQty,
              price: fillPrice,
              portId,
              filledAt: now,
            })

            players = players.map((p) => {
              if (p.id === buy.playerId) return { ...p, balance: p.balance - total }
              if (p.id === sell.playerId) return { ...p, balance: p.balance + total }
              return p
            })

            buy.qty -= fillQty
            sell.qty -= fillQty
          }
        }

        orders = orders.filter((o) => o.qty > 0)
      }

      return { ...state, orders, players, contracts: contracts.slice(0, 50) }
    }

    case 'DISPATCH_SHIP': {
      const { shipId, destPortId, now } = action
      const ship = state.ships.find((s) => s.id === shipId)
      if (!ship || ship.status === 'in_transit') return state
      if (ship.currentPortId === destPortId) return state

      const transitMs = estimateTransitMs(ship.currentPortId, destPortId)
      const route = {
        id: nextId('route'),
        shipId,
        originPortId: ship.currentPortId,
        destPortId,
        departedAt: now,
        eta: now + transitMs,
        status: 'in_transit' as const,
      }

      const ships = state.ships.map((s) =>
        s.id === shipId ? { ...s, status: 'in_transit' as const } : s,
      )

      return {
        ...state,
        ships,
        routes: [...state.routes, route],
      }
    }

    case 'PLACE_ORDER': {
      const { playerId, portId, qty, price, side, now } = action
      if (qty <= 0 || price <= 0) return state

      const order = {
        id: nextId('order'),
        playerId,
        portId,
        commodity: COMMODITY,
        qty,
        bidPrice: price,
        side,
        createdAt: now,
      }

      return { ...state, orders: [order, ...state.orders] }
    }

    case 'CANCEL_ORDER': {
      const { orderId, playerId } = action
      return {
        ...state,
        orders: state.orders.filter(
          (o) => !(o.id === orderId && o.playerId === playerId),
        ),
      }
    }

    default:
      return state
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const [currentPlayerId, setCurrentPlayerId] = useReducer(
    (_: string, id: string) => id,
    'player-1',
  )
  const [selectedPortId, setSelectedPortId] = useReducer(
    (_: string, id: string) => id,
    'port-rotterdam',
  )
  const now = useStateTick()

  const dispatchShip = useCallback(
    (shipId: string, destPortId: string) => {
      dispatch({ type: 'DISPATCH_SHIP', shipId, destPortId, now: Date.now() })
    },
    [],
  )

  const placeOrder = useCallback(
    (portId: string, qty: number, price: number, side: OrderSide) => {
      dispatch({
        type: 'PLACE_ORDER',
        playerId: currentPlayerId,
        portId,
        qty,
        price,
        side,
        now: Date.now(),
      })
    },
    [currentPlayerId],
  )

  const cancelOrder = useCallback(
    (orderId: string) => {
      dispatch({ type: 'CANCEL_ORDER', orderId, playerId: currentPlayerId })
    },
    [currentPlayerId],
  )

  useEffect(() => {
    const priceInterval = setInterval(() => dispatch({ type: 'TICK_PRICES' }), 8000)
    const matchInterval = setInterval(
      () => dispatch({ type: 'MATCH_ORDERS', now: Date.now() }),
      4000,
    )
    const arrivalInterval = setInterval(
      () => dispatch({ type: 'TICK_ARRIVALS', now: Date.now() }),
      2000,
    )

    return () => {
      clearInterval(priceInterval)
      clearInterval(matchInterval)
      clearInterval(arrivalInterval)
    }
  }, [])

  const value = useMemo(
    () => ({
      state,
      currentPlayerId,
      selectedPortId,
      dispatchShip,
      placeOrder,
      cancelOrder,
      setCurrentPlayer: setCurrentPlayerId,
      setSelectedPort: setSelectedPortId,
      now,
    }),
    [
      state,
      currentPlayerId,
      selectedPortId,
      dispatchShip,
      placeOrder,
      cancelOrder,
      now,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

function useStateTick(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
