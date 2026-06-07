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
import type SanctionRow from '../module_bindings/sanction_table'
import type { PricePoint } from '../lib/utils'

export type Country = Infer<typeof CountryRow>
export type TradeOffer = Infer<typeof TradeOfferRow>
export type TradeHistory = Infer<typeof TradeHistoryRow>
export type SpotPrice = Infer<typeof SpotPriceRow>
export type Commodity = Infer<typeof CommodityRow>
export type CountryResource = Infer<typeof CountryResourceRow>
export type Sanction = Infer<typeof SanctionRow>

export interface GameContextValue {
  connected: boolean
  connecting: boolean
  error: string | null
  playerCountryId: bigint | null
  playerCountry: Country | null
  countries: readonly Country[]
  onlineHumans: readonly Country[]
  commodities: readonly Commodity[]
  resources: readonly CountryResource[]
  offers: readonly TradeOffer[]
  spotPrices: readonly SpotPrice[]
  tradeHistory: readonly TradeHistory[]
  sanctions: readonly Sanction[]
  activeSanctions: readonly Sanction[]
  selectedCommodityId: bigint | null
  priceHistory: Record<string, PricePoint[]>
  now: number
  tablesReady: boolean
  placeOffer: (commodityId: bigint, qty: number, pricePerUnit: number) => Promise<void>
  acceptOffer: (offerId: bigint) => Promise<void>
  cancelOffer: (offerId: bigint) => Promise<void>
  setCountryProfile: (name: string, isoCode: string) => Promise<void>
  imposeSanction: (targetCountryId: bigint, commodityId: bigint, reason: string) => Promise<void>
  liftSanction: (sanctionId: bigint) => Promise<void>
  setSelectedCommodity: (id: bigint) => void
  resetWorld: () => Promise<void>
}

const GameContext = createContext<GameContextValue | null>(null)

const PRICE_HISTORY_MAX = 300
const CHART_SAMPLE_MS = 1000

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
  const [sanctions, sanctionsReady] = useTable(tables.sanction)

  const [selectedCommodityId, setSelectedCommodityId] = useState<bigint | null>(null)
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const spotPricesRef = useRef(spotPrices)
  spotPricesRef.current = spotPrices

  const placeOfferReducer = useReducer(reducers.placeOffer)
  const acceptTradeReducer = useReducer(reducers.acceptTrade)
  const cancelOfferReducer = useReducer(reducers.cancelOffer)
  const setProfileReducer = useReducer(reducers.setCountryProfile)
  const imposeSanctionReducer = useReducer(reducers.imposeSanction)
  const liftSanctionReducer = useReducer(reducers.liftSanction)
  const resetWorldReducer = useReducer(reducers.resetWorld)

  const tablesReady =
    countriesReady &&
    commoditiesReady &&
    resourcesReady &&
    offersReady &&
    spotReady &&
    historyReady &&
    playersReady &&
    sanctionsReady

  const playerCountryId = useMemo(() => {
    if (!identity) return null
    const link = players.find((p) => p.identity.isEqual(identity))
    return link?.countryId ?? null
  }, [players, identity])

  const playerCountry = useMemo(
    () => (playerCountryId != null ? countries.find((c) => c.id === playerCountryId) ?? null : null),
    [countries, playerCountryId],
  )

  const onlineHumans = useMemo(
    () => countries.filter((c) => !c.isBot && c.online),
    [countries],
  )

  const activeSanctions = useMemo(
    () => sanctions.filter((s) => s.active),
    [sanctions],
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

  /** Sample live spot prices every second so the market chart always advances. */
  useEffect(() => {
    if (!tablesReady) return

    const appendSample = () => {
      const spots = spotPricesRef.current
      if (spots.length === 0) return

      const ts = Date.now()
      const tickKey = `s-${ts}`

      setPriceHistory((prev) => {
        let next = { ...prev }
        for (const spot of spots) {
          const key = spot.commodityId.toString()
          next[key] = [
            ...(next[key] ?? []),
            { timestamp: ts, price: spot.price, serverTick: tickKey },
          ].slice(-PRICE_HISTORY_MAX)
        }
        return next
      })
    }

    appendSample()
    const id = setInterval(appendSample, CHART_SAMPLE_MS)
    return () => clearInterval(id)
  }, [tablesReady])

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
        const msg = e instanceof Error ? e.message : 'Failed to accept trade'
        setError(msg)
        throw e
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

  const imposeSanction = useCallback(
    async (targetCountryId: bigint, commodityId: bigint, reason: string) => {
      setError(null)
      try {
        await imposeSanctionReducer({ targetCountryId, commodityId, reason })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to impose sanction')
      }
    },
    [imposeSanctionReducer],
  )

  const liftSanction = useCallback(
    async (sanctionId: bigint) => {
      setError(null)
      try {
        await liftSanctionReducer({ sanctionId })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to lift sanction')
      }
    },
    [liftSanctionReducer],
  )

  const resetWorld = useCallback(async () => {
    setError(null)
    try {
      await resetWorldReducer()
      setPriceHistory({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset world')
      throw e
    }
  }, [resetWorldReducer])

  const value = useMemo(
    (): GameContextValue => ({
      connected,
      connecting,
      error,
      playerCountryId,
      playerCountry,
      countries,
      onlineHumans,
      commodities,
      resources,
      offers,
      spotPrices,
      tradeHistory: sortedHistory,
      sanctions,
      activeSanctions,
      selectedCommodityId,
      priceHistory,
      now,
      tablesReady,
      placeOffer,
      acceptOffer,
      cancelOffer,
      setCountryProfile,
      imposeSanction,
      liftSanction,
      setSelectedCommodity: setSelectedCommodityId,
      resetWorld,
    }),
    [
      connected,
      connecting,
      error,
      playerCountryId,
      playerCountry,
      countries,
      onlineHumans,
      commodities,
      resources,
      offers,
      spotPrices,
      sortedHistory,
      sanctions,
      activeSanctions,
      selectedCommodityId,
      priceHistory,
      now,
      tablesReady,
      placeOffer,
      acceptOffer,
      cancelOffer,
      setCountryProfile,
      imposeSanction,
      liftSanction,
      resetWorld,
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
