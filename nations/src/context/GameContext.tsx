import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useReducer, useSpacetimeDB, useTable } from 'spacetimedb/react'
import { tables, reducers, type DbConnection } from '../module_bindings'
import type { Infer } from 'spacetimedb'
import type CountryRow from '../module_bindings/country_table'
import type TradeOfferRow from '../module_bindings/trade_offer_table'
import type TradeHistoryRow from '../module_bindings/trade_history_table'
import type SpotPriceRow from '../module_bindings/spot_price_table'
import type CommodityRow from '../module_bindings/commodity_table'
import type CountryResourceRow from '../module_bindings/country_resource_table'
import type { PricePoint } from '../lib/utils'

export type Country = Infer<typeof CountryRow>
export type TradeOffer = Infer<typeof TradeOfferRow>
export type TradeHistory = Infer<typeof TradeHistoryRow>
export type SpotPrice = Infer<typeof SpotPriceRow>
export type Commodity = Infer<typeof CommodityRow>
export type CountryResource = Infer<typeof CountryResourceRow>

interface GameContextValue {
  connected: boolean
  connecting: boolean
  error: string | null
  playerCountryId: bigint | null
  playerCountry: Country | null
  countries: readonly Country[]
  commodities: readonly Commodity[]
  resources: readonly CountryResource[]
  offers: readonly TradeOffer[]
  spotPrices: readonly SpotPrice[]
  tradeHistory: readonly TradeHistory[]
  selectedCommodityId: bigint | null
  priceHistory: Record<string, PricePoint[]>
  now: number
  tablesReady: boolean
  placeOffer: (commodityId: bigint, qty: number, pricePerUnit: number) => Promise<void>
  acceptOffer: (offerId: bigint) => Promise<void>
  cancelOffer: (offerId: bigint) => Promise<void>
  setCountryProfile: (name: string, isoCode: string) => Promise<void>
  setSelectedCommodity: (id: bigint) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const { identity, isActive: connected } = useSpacetimeDB()
  const connecting = false

  const [countries, countriesReady] = useTable(tables.country)
  const [commodities, commoditiesReady] = useTable(tables.commodity)
  const [resources, resourcesReady] = useTable(tables.countryResource)
  const [offers, offersReady] = useTable(
    tables.tradeOffer.where((r) => r.status.eq('open')),
  )
  const [spotPrices, spotReady] = useTable(tables.spotPrice)
  const [tradeHistory, historyReady] = useTable(tables.tradeHistory)
  const [players, playersReady] = useTable(tables.player)

  const [selectedCommodityId, setSelectedCommodityId] = useState<bigint | null>(null)
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const prevSpotRef = useRef<Map<string, number>>(new Map())

  const placeOfferReducer = useReducer(reducers.placeOffer)
  const acceptTradeReducer = useReducer(reducers.acceptTrade)
  const cancelOfferReducer = useReducer(reducers.cancelOffer)
  const setProfileReducer = useReducer(reducers.setCountryProfile)

  const tablesReady =
    countriesReady &&
    commoditiesReady &&
    resourcesReady &&
    offersReady &&
    spotReady &&
    historyReady &&
    playersReady

  const playerCountryId = useMemo(() => {
    if (!identity) return null
    const link = players.find((p) => p.identity.isEqual(identity))
    return link?.countryId ?? null
  }, [players, identity])

  const playerCountry = useMemo(
    () => (playerCountryId != null ? countries.find((c) => c.id === playerCountryId) ?? null : null),
    [countries, playerCountryId],
  )

  useEffect(() => {
    if (commodities.length > 0 && selectedCommodityId == null) {
      setSelectedCommodityId(commodities[0]!.id)
    }
  }, [commodities, selectedCommodityId])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const ts = Date.now()
    setPriceHistory((prev) => {
      let next = prev
      for (const spot of spotPrices) {
        const key = spot.commodityId.toString()
        const prevPrice = prevSpotRef.current.get(key)
        if (prevPrice === spot.price) continue
        prevSpotRef.current.set(key, spot.price)
        const history = [...(next[key] ?? []), { timestamp: ts, price: spot.price }].slice(-30)
        next = { ...next, [key]: history }
      }
      return next
    })
  }, [spotPrices])

  const sortedHistory = useMemo(
    () =>
      [...tradeHistory].sort(
        (a, b) =>
          Number(b.filledAt.microsSinceUnixEpoch - a.filledAt.microsSinceUnixEpoch),
      ),
    [tradeHistory],
  )

  const placeOffer = useCallback(
    async (commodityId: bigint, qty: number, pricePerUnit: number) => {
      setError(null)
      try {
        await placeOfferReducer({ commodityId, qty, pricePerUnit })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to place offer')
      }
    },
    [placeOfferReducer],
  )

  const acceptOffer = useCallback(
    async (offerId: bigint) => {
      setError(null)
      try {
        await acceptTradeReducer({ offerId })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to accept trade')
      }
    },
    [acceptTradeReducer],
  )

  const cancelOffer = useCallback(
    async (offerId: bigint) => {
      setError(null)
      try {
        await cancelOfferReducer({ offerId })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to cancel offer')
      }
    },
    [cancelOfferReducer],
  )

  const setCountryProfile = useCallback(
    async (name: string, isoCode: string) => {
      setError(null)
      try {
        await setProfileReducer({ name, isoCode })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update profile')
      }
    },
    [setProfileReducer],
  )

  const value = useMemo(
    (): GameContextValue => ({
      connected,
      connecting,
      error,
      playerCountryId,
      playerCountry,
      countries,
      commodities,
      resources,
      offers,
      spotPrices,
      tradeHistory: sortedHistory,
      selectedCommodityId,
      priceHistory,
      now,
      tablesReady,
      placeOffer,
      acceptOffer,
      cancelOffer,
      setCountryProfile,
      setSelectedCommodity: setSelectedCommodityId,
    }),
    [
      connected,
      connecting,
      error,
      playerCountryId,
      playerCountry,
      countries,
      commodities,
      resources,
      offers,
      spotPrices,
      sortedHistory,
      selectedCommodityId,
      priceHistory,
      now,
      tablesReady,
      placeOffer,
      acceptOffer,
      cancelOffer,
      setCountryProfile,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export type { DbConnection }
