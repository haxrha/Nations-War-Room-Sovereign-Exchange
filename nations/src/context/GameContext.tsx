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
import { createInitialState, type GameState } from '../data/mockData'
import { getCommodity, getCountry, getResource } from '../lib/utils'
import type { OfferType } from '../types'

type GameAction =
  | { type: 'TICK_PRICES' }
  | { type: 'BOT_TICK'; now: number }
  | { type: 'COMPLETE_ROUTES'; now: number }
  | { type: 'PLACE_OFFER'; countryId: string; commodityId: string; qty: number; pricePerUnit: number; offerType: OfferType; now: number }
  | { type: 'ACCEPT_OFFER'; offerId: string; acceptorCountryId: string; now: number }
  | { type: 'CANCEL_OFFER'; offerId: string; countryId: string }
  | { type: 'SET_PLAYER'; countryId: string }
  | { type: 'SELECT_COMMODITY'; commodityId: string }

interface GameContextValue {
  state: GameState
  placeOffer: (commodityId: string, qty: number, pricePerUnit: number, offerType: OfferType) => void
  acceptOffer: (offerId: string) => void
  cancelOffer: (offerId: string) => void
  setPlayerCountry: (countryId: string) => void
  setSelectedCommodity: (commodityId: string) => void
  now: number
}

const GameContext = createContext<GameContextValue | null>(null)
let idCounter = 200
const nextId = (p: string) => `${p}-${++idCounter}`

function updateResource(resources: GameState['resources'], countryId: string, commodityId: string, delta: number) {
  const existing = resources.find((r) => r.countryId === countryId && r.commodityId === commodityId)
  if (existing) return resources.map((r) => r.countryId === countryId && r.commodityId === commodityId ? { ...r, qty: Math.max(0, r.qty + delta) } : r)
  return delta > 0 ? [...resources, { countryId, commodityId, qty: delta }] : resources
}

function executeTrade(state: GameState, offer: GameState['offers'][0], buyerId: string, sellerId: string, now: number): GameState {
  const total = offer.qty * offer.pricePerUnit
  const countries = state.countries.map((c) => {
    if (c.id === buyerId) return { ...c, balance: c.balance - total }
    if (c.id === sellerId) return { ...c, balance: c.balance + total }
    return c
  })
  let resources = updateResource(state.resources, sellerId, offer.commodityId, -offer.qty)
  resources = updateResource(resources, buyerId, offer.commodityId, offer.qty)
  const route = { id: nextId('route'), fromCountryId: sellerId, toCountryId: buyerId, commodityId: offer.commodityId, qty: offer.qty, startedAt: now, completesAt: now + 12_000 + Math.random() * 8_000 }
  const completedTrades = [{ id: nextId('trade'), sellerId, buyerId, commodityId: offer.commodityId, qty: offer.qty, totalPrice: total, filledAt: now }, ...state.completedTrades].slice(0, 30)
  const offers = state.offers.map((o) => o.id === offer.id ? { ...o, status: 'accepted' as const, acceptedBy: buyerId, acceptedAt: now } : o)
  return { ...state, countries, resources, offers, routes: [...state.routes, route], completedTrades }
}

function botShouldAccept(bot: GameState['countries'][0], offer: GameState['offers'][0], state: GameState): boolean {
  const spot = state.spotPrices.find((s) => s.countryId === bot.id && s.commodityId === offer.commodityId)
  const market = spot?.price ?? getCommodity(offer.commodityId)?.basePrice ?? 0
  if (offer.type === 'sell') {
    if (bot.personality === 'flood_oil') return offer.commodityId === 'oil' && offer.pricePerUnit <= market * 1.05
    if (bot.personality === 'import_focused') return offer.pricePerUnit <= market * 0.98
    if (bot.personality === 'undercut') return offer.pricePerUnit <= market * 0.92
    return offer.pricePerUnit <= market * 0.97
  }
  const stock = getResource(bot.id, offer.commodityId, state.resources)
  if (stock < offer.qty) return false
  if (bot.personality === 'flood_oil') return offer.commodityId === 'oil' && offer.pricePerUnit >= market * 0.85
  if (bot.personality === 'undercut') return offer.pricePerUnit >= market * 1.08
  return offer.pricePerUnit >= market * 0.98
}

function botCreateOffer(bot: GameState['countries'][0], state: GameState, now: number) {
  if (state.offers.filter((o) => o.status === 'open' && o.fromCountryId === bot.id).length >= 2) return null
  const exportCommodity = bot.exports[Math.floor(Math.random() * bot.exports.length)]
  const stock = getResource(bot.id, exportCommodity, state.resources)
  if (stock < 10_000) return null
  const spot = state.spotPrices.find((s) => s.countryId === bot.id && s.commodityId === exportCommodity)
  const market = spot?.price ?? getCommodity(exportCommodity)?.basePrice ?? 100
  let mult = bot.personality === 'flood_oil' ? 0.88 : bot.personality === 'undercut' ? 0.93 : bot.personality === 'protect_manufacturing' ? 1.06 : 0.98
  return { id: nextId('offer'), fromCountryId: bot.id, commodityId: exportCommodity, qty: Math.floor(stock * 0.03), pricePerUnit: Math.round(market * mult * 100) / 100, type: 'sell' as const, status: 'open' as const, createdAt: now }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK_PRICES': {
      const now = Date.now()
      const spotPrices = state.spotPrices.map((spot) => {
        const commodity = getCommodity(spot.commodityId)
        const country = getCountry(spot.countryId, state.countries)
        const openOffers = state.offers.filter((o) => o.status === 'open' && o.commodityId === spot.commodityId)
        const imbalance = (openOffers.filter((o) => o.type === 'buy').length - openOffers.filter((o) => o.type === 'sell').length) * 0.4
        const anchor = commodity?.basePrice ?? spot.price
        const hubBias = country?.exports.includes(spot.commodityId) ? -0.3 : 0.2
        const price = Math.max(1, spot.price + (imbalance + hubBias + (Math.random() - 0.5) * 1.5 + (anchor - spot.price) * 0.015) * 0.12)
        return { ...spot, prevPrice: spot.price, price: Math.round(price * 100) / 100, updatedAt: now }
      })
      const priceHistory = { ...state.priceHistory }
      for (const spot of spotPrices) {
        const key = `${spot.countryId}-${spot.commodityId}`
        priceHistory[key] = [...(priceHistory[key] ?? []), { timestamp: now, price: spot.price }].slice(-20)
      }
      return { ...state, spotPrices, priceHistory, tickCount: state.tickCount + 1 }
    }
    case 'BOT_TICK': {
      const { now } = action
      let next = { ...state }
      let lastBotAction = ''
      for (const bot of state.countries.filter((c) => c.isBot)) {
        for (const offer of next.offers.filter((o) => o.status === 'open' && o.fromCountryId !== bot.id)) {
          if (!botShouldAccept(bot, offer, next)) continue
          const buyerId = offer.type === 'sell' ? bot.id : offer.fromCountryId
          const sellerId = offer.type === 'sell' ? offer.fromCountryId : bot.id
          const total = offer.qty * offer.pricePerUnit
          const buyer = getCountry(buyerId, next.countries)
          if (!buyer || buyer.balance < total) continue
          if (offer.type === 'buy' && getResource(sellerId, offer.commodityId, next.resources) < offer.qty) continue
          next = executeTrade(next, offer, buyerId, sellerId, now)
          lastBotAction = `${bot.flag} ${bot.name} accepted a trade`
          break
        }
        const newOffer = botCreateOffer(bot, next, now)
        if (newOffer && Math.random() > 0.4) next = { ...next, offers: [newOffer, ...next.offers] }
      }
      return { ...next, lastBotAction }
    }
    case 'COMPLETE_ROUTES':
      return { ...state, routes: state.routes.filter((r) => r.completesAt > action.now) }
    case 'PLACE_OFFER': {
      const { countryId, commodityId, qty, pricePerUnit, offerType, now } = action
      if (qty <= 0 || pricePerUnit <= 0) return state
      if (offerType === 'sell' && getResource(countryId, commodityId, state.resources) < qty) return state
      if (offerType === 'buy') {
        const c = getCountry(countryId, state.countries)
        if (!c || c.balance < qty * pricePerUnit) return state
      }
      return { ...state, offers: [{ id: nextId('offer'), fromCountryId: countryId, commodityId, qty, pricePerUnit, type: offerType, status: 'open', createdAt: now }, ...state.offers], lastBotAction: '' }
    }
    case 'ACCEPT_OFFER': {
      const offer = state.offers.find((o) => o.id === action.offerId && o.status === 'open')
      if (!offer || offer.fromCountryId === action.acceptorCountryId) return state
      const buyerId = offer.type === 'sell' ? action.acceptorCountryId : offer.fromCountryId
      const sellerId = offer.type === 'sell' ? offer.fromCountryId : action.acceptorCountryId
      const total = offer.qty * offer.pricePerUnit
      const buyer = getCountry(buyerId, state.countries)
      if (!buyer || buyer.balance < total) return state
      if (offer.type === 'buy' && getResource(sellerId, offer.commodityId, state.resources) < offer.qty) return state
      return executeTrade(state, offer, buyerId, sellerId, action.now)
    }
    case 'CANCEL_OFFER':
      return { ...state, offers: state.offers.map((o) => o.id === action.offerId && o.fromCountryId === action.countryId && o.status === 'open' ? { ...o, status: 'cancelled' as const } : o) }
    case 'SET_PLAYER':
      return { ...state, playerCountryId: action.countryId }
    case 'SELECT_COMMODITY':
      return { ...state, selectedCommodityId: action.commodityId }
    default:
      return state
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const p = setInterval(() => dispatch({ type: 'TICK_PRICES' }), 6000)
    const b = setInterval(() => dispatch({ type: 'BOT_TICK', now: Date.now() }), 5000)
    const r = setInterval(() => dispatch({ type: 'COMPLETE_ROUTES', now: Date.now() }), 1000)
    return () => { clearInterval(p); clearInterval(b); clearInterval(r) }
  }, [])

  const placeOffer = useCallback((commodityId: string, qty: number, pricePerUnit: number, offerType: OfferType) => {
    dispatch({ type: 'PLACE_OFFER', countryId: state.playerCountryId, commodityId, qty, pricePerUnit, offerType, now: Date.now() })
  }, [state.playerCountryId])

  const acceptOffer = useCallback((offerId: string) => {
    dispatch({ type: 'ACCEPT_OFFER', offerId, acceptorCountryId: state.playerCountryId, now: Date.now() })
  }, [state.playerCountryId])

  const cancelOffer = useCallback((offerId: string) => {
    dispatch({ type: 'CANCEL_OFFER', offerId, countryId: state.playerCountryId })
  }, [state.playerCountryId])

  const value = useMemo(() => ({
    state,
    placeOffer,
    acceptOffer,
    cancelOffer,
    setPlayerCountry: (id: string) => dispatch({ type: 'SET_PLAYER', countryId: id }),
    setSelectedCommodity: (id: string) => dispatch({ type: 'SELECT_COMMODITY', commodityId: id }),
    now,
  }), [state, placeOffer, acceptOffer, cancelOffer, now])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
