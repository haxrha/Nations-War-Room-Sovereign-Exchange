import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plane, Crosshair, Navigation, Gauge, MapPin, Package, X, Zap, Wind } from 'lucide-react'
import { useGame, type Country } from '../../context/GameContext'
import { formatMoney, formatPrice, formatQty, getCommodity, idStr } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { Button } from '../ui/Button'
import { tokens } from '../../lib/design-system'
import { cn } from '../../lib/cn'

/** Minimal shape the flight view needs from a country. */
export interface FlightCountry {
  key: string
  id?: bigint
  name: string
  flag: string
  region: string
  lat: number
  lng: number
  gdpScore?: number
  isPlayer?: boolean
}

/** Fallback capitals so the tab is fun to explore even before the backend connects. */
const FALLBACK_COUNTRIES: FlightCountry[] = [
  { key: 'usa', name: 'United States', flag: '🇺🇸', region: 'North America', lat: 38.9, lng: -77.0 },
  { key: 'can', name: 'Canada', flag: '🇨🇦', region: 'North America', lat: 45.4, lng: -75.7 },
  { key: 'mex', name: 'Mexico', flag: '🇲🇽', region: 'North America', lat: 19.4, lng: -99.1 },
  { key: 'bra', name: 'Brazil', flag: '🇧🇷', region: 'South America', lat: -15.8, lng: -47.9 },
  { key: 'arg', name: 'Argentina', flag: '🇦🇷', region: 'South America', lat: -34.6, lng: -58.4 },
  { key: 'gbr', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe', lat: 51.5, lng: -0.13 },
  { key: 'fra', name: 'France', flag: '🇫🇷', region: 'Europe', lat: 48.9, lng: 2.35 },
  { key: 'deu', name: 'Germany', flag: '🇩🇪', region: 'Europe', lat: 52.5, lng: 13.4 },
  { key: 'esp', name: 'Spain', flag: '🇪🇸', region: 'Europe', lat: 40.4, lng: -3.7 },
  { key: 'ita', name: 'Italy', flag: '🇮🇹', region: 'Europe', lat: 41.9, lng: 12.5 },
  { key: 'rus', name: 'Russia', flag: '🇷🇺', region: 'Eurasia', lat: 55.8, lng: 37.6 },
  { key: 'tur', name: 'Türkiye', flag: '🇹🇷', region: 'Eurasia', lat: 39.9, lng: 32.9 },
  { key: 'egy', name: 'Egypt', flag: '🇪🇬', region: 'Africa', lat: 30.0, lng: 31.2 },
  { key: 'nga', name: 'Nigeria', flag: '🇳🇬', region: 'Africa', lat: 9.1, lng: 7.5 },
  { key: 'zaf', name: 'South Africa', flag: '🇿🇦', region: 'Africa', lat: -25.7, lng: 28.2 },
  { key: 'ken', name: 'Kenya', flag: '🇰🇪', region: 'Africa', lat: -1.3, lng: 36.8 },
  { key: 'sau', name: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East', lat: 24.7, lng: 46.7 },
  { key: 'are', name: 'UAE', flag: '🇦🇪', region: 'Middle East', lat: 24.5, lng: 54.4 },
  { key: 'ind', name: 'India', flag: '🇮🇳', region: 'South Asia', lat: 28.6, lng: 77.2 },
  { key: 'chn', name: 'China', flag: '🇨🇳', region: 'East Asia', lat: 39.9, lng: 116.4 },
  { key: 'jpn', name: 'Japan', flag: '🇯🇵', region: 'East Asia', lat: 35.7, lng: 139.7 },
  { key: 'kor', name: 'South Korea', flag: '🇰🇷', region: 'East Asia', lat: 37.6, lng: 127.0 },
  { key: 'idn', name: 'Indonesia', flag: '🇮🇩', region: 'SE Asia', lat: -6.2, lng: 106.8 },
  { key: 'aus', name: 'Australia', flag: '🇦🇺', region: 'Oceania', lat: -35.3, lng: 149.1 },
  { key: 'nzl', name: 'New Zealand', flag: '🇳🇿', region: 'Oceania', lat: -41.3, lng: 174.8 },
]

const EARTH_RADIUS_KM = 6371
/** Within this distance (km) we consider the plane “at” a country node. */
const NODE_HIT_KM = 52
const MAX_SPEED_DEG_PER_SEC = 9
const TURN_RATE_DEG_PER_SEC = 95
const THROTTLE_RATE = 1.6
const BOOST_MULT = 2.05
const BOOST_MS = 2800
const DRIFT_SPEED_MULT = 0.42

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

function bearingDeg(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const φ1 = toRad(aLat)
  const φ2 = toRad(bLat)
  const Δλ = toRad(bLng - aLng)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * 180) / Math.PI
}

function wrapLng(lng: number): number {
  let v = lng
  while (v > 180) v -= 360
  while (v < -180) v += 360
  return v
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

const PLANE_SVG = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2.2c.8 0 1.45 1.1 1.45 2.45v4.2l7.4 4.35v2.1l-7.4-2.3v4.05l2.1 1.55v1.7L12 19.5l-3.05 1.55v-1.7l2.1-1.55V13.7l-7.4 2.3v-2.1l7.4-4.35v-4.2C10.55 3.3 11.2 2.2 12 2.2Z"
    fill="#9AA0FF" stroke="#EDEDEF" stroke-width="0.8" stroke-linejoin="round"/>
</svg>`

interface PlaneState {
  lat: number
  lng: number
  heading: number
  throttle: number
}

export interface FlightExtras {
  boostUntilMs: number
  drift: boolean
}

interface Hud {
  lat: number
  lng: number
  heading: number
  speedKmh: number
  nearest: { key: string; name: string; flag: string; km: number } | null
}

interface FlightLayerProps {
  planeRef: React.MutableRefObject<PlaneState>
  keysRef: React.MutableRefObject<Set<string>>
  followRef: React.MutableRefObject<boolean>
  destinationRef: React.MutableRefObject<FlightCountry | null>
  countriesRef: React.MutableRefObject<FlightCountry[]>
  extrasRef: React.MutableRefObject<FlightExtras>
  playerHomeKeyRef: React.MutableRefObject<string | null>
  hasCargoRef: React.MutableRefObject<boolean>
  onHud: (hud: Hud) => void
  onUserDrag: () => void
  onHomeDeliveryEdgeRef: React.MutableRefObject<() => void>
  active: boolean
}

/** Imperative layer: plane marker, route line, physics, proximity → home delivery edge. */
function FlightLayer({
  planeRef,
  keysRef,
  followRef,
  destinationRef,
  countriesRef,
  extrasRef,
  playerHomeKeyRef,
  hasCargoRef,
  onHud,
  onUserDrag,
  onHomeDeliveryEdgeRef,
  active,
}: FlightLayerProps) {
  const map = useMap()

  useEffect(() => {
    const plane = planeRef.current
    const marker = L.marker([plane.lat, plane.lng], {
      icon: L.divIcon({
        className: 'plane-marker',
        html: `<div class="plane-marker__inner">${PLANE_SVG}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    }).addTo(map)

    const route = L.polyline([], {
      color: tokens.color.accent,
      weight: 1.5,
      opacity: 0.6,
      dashArray: '6 8',
    }).addTo(map)

    const innerEl = () =>
      marker.getElement()?.querySelector<HTMLElement>('.plane-marker__inner') ?? null

    map.on('dragstart', onUserDrag)

    let raf = 0
    let last = performance.now()
    let hudAccum = 0
    let prevInsideHomeDelivery = false

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const p = planeRef.current
      const keys = keysRef.current
      const ex = extrasRef.current
      const nowMs = performance.now()
      const boostOn = nowMs < ex.boostUntilMs
      const speedMul = boostOn ? BOOST_MULT : 1

      if (keys.has('a')) p.heading -= TURN_RATE_DEG_PER_SEC * dt
      if (keys.has('d')) p.heading += TURN_RATE_DEG_PER_SEC * dt
      if (p.heading < 0) p.heading += 360
      if (p.heading >= 360) p.heading -= 360

      if (keys.has('w')) p.throttle = clamp(p.throttle + THROTTLE_RATE * dt, -0.4, 1)
      if (keys.has('s')) p.throttle = clamp(p.throttle - THROTTLE_RATE * dt, -0.4, 1)
      if (keys.has(' ')) p.throttle *= 1 - Math.min(1, 4 * dt)
      if (!keys.has('w') && !keys.has('s')) {
        p.throttle *= 1 - Math.min(1, 0.6 * dt)
        if (Math.abs(p.throttle) < 0.002) p.throttle = 0
      }

      let speedDeg = p.throttle * MAX_SPEED_DEG_PER_SEC * speedMul
      if (speedDeg !== 0) {
        const rad = toRad(p.heading)
        const dLat = Math.cos(rad) * speedDeg * dt
        const lngScale = Math.max(0.18, Math.cos(toRad(p.lat)))
        const dLng = (Math.sin(rad) * speedDeg * dt) / lngScale
        p.lat = clamp(p.lat + dLat, -85, 85)
        p.lng = wrapLng(p.lng + dLng)
      }

      if (ex.drift) {
        const driftRad = toRad(p.heading + 90)
        const driftSpeed = MAX_SPEED_DEG_PER_SEC * DRIFT_SPEED_MULT * dt * (boostOn ? 1.15 : 1)
        const lngScale2 = Math.max(0.18, Math.cos(toRad(p.lat)))
        p.lat = clamp(p.lat + Math.cos(driftRad) * driftSpeed, -85, 85)
        p.lng = wrapLng(p.lng + (Math.sin(driftRad) * driftSpeed) / lngScale2)
      }

      marker.setLatLng([p.lat, p.lng])
      const el = innerEl()
      if (el) el.style.transform = `rotate(${p.heading}deg)`

      const dest = destinationRef.current
      if (dest) {
        route.setLatLngs([
          [p.lat, p.lng],
          [dest.lat, dest.lng],
        ])
      } else {
        route.setLatLngs([])
      }

      if (followRef.current) {
        map.panTo([p.lat, p.lng], { animate: false })
      }

      const list = countriesRef.current
      let nearest: Hud['nearest'] = null
      let best = Infinity
      let closestForHit: { c: FlightCountry; km: number } | null = null
      for (const c of list) {
        const km = haversineKm(p.lat, p.lng, c.lat, c.lng)
        if (km < best) {
          best = km
          nearest = { key: c.key, name: c.name, flag: c.flag, km }
        }
        if (km < NODE_HIT_KM && (!closestForHit || km < closestForHit.km)) {
          closestForHit = { c, km }
        }
      }

      const homeKey = playerHomeKeyRef.current
      const hasCargo = hasCargoRef.current
      let insideHomeDelivery = Boolean(
        homeKey && hasCargo && closestForHit && closestForHit.c.key === homeKey && closestForHit.km < NODE_HIT_KM,
      )
      if (!hasCargo) insideHomeDelivery = false

      if (insideHomeDelivery && !prevInsideHomeDelivery) {
        onHomeDeliveryEdgeRef.current()
      }
      prevInsideHomeDelivery = insideHomeDelivery

      hudAccum += dt
      if (hudAccum >= 0.08) {
        hudAccum = 0
        onHud({
          lat: p.lat,
          lng: p.lng,
          heading: p.heading,
          speedKmh: Math.abs(speedDeg) * 111,
          nearest,
        })
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      map.off('dragstart', onUserDrag)
      marker.remove()
      route.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100)
    const t2 = setTimeout(() => map.invalidateSize(), 350)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [map, active])

  return null
}

function compassLabel(heading: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(heading / 45) % 8]!
}

export type FlightCargo = {
  offerId: bigint
  sellerCountryId: bigint
  commodityId: bigint
  commoditySymbol: string
  commodityName: string
  qty: number
  totalCost: number
  sellerName: string
  sellerFlag: string
}

export function FlightMap({ active = true, className }: { active?: boolean; className?: string }) {
  const {
    countries,
    playerCountryId,
    playerCountry,
    offers,
    commodities,
    acceptOffer,
    connected,
  } = useGame()

  const flightCountries = useMemo<FlightCountry[]>(() => {
    if (countries.length > 0) {
      return countries.map((c: Country) => ({
        key: idStr(c.id),
        id: c.id,
        name: c.name,
        flag: c.flag,
        region: c.region,
        lat: c.lat,
        lng: c.lng,
        gdpScore: c.gdpScore,
        isPlayer: playerCountryId != null && c.id === playerCountryId,
      }))
    }
    return FALLBACK_COUNTRIES
  }, [countries, playerCountryId])

  const playerHomeKey = useMemo(
    () => flightCountries.find((c) => c.isPlayer)?.key ?? null,
    [flightCountries],
  )

  const planeRef = useRef<PlaneState>({ lat: 25, lng: 5, heading: 90, throttle: 0 })
  const keysRef = useRef<Set<string>>(new Set())
  const followRef = useRef(true)
  const destinationRef = useRef<FlightCountry | null>(null)
  const countriesRef = useRef<FlightCountry[]>(flightCountries)
  const extrasRef = useRef<FlightExtras>({ boostUntilMs: 0, drift: false })
  const playerHomeKeyRef = useRef<string | null>(null)
  const hasCargoRef = useRef(false)

  const [hud, setHud] = useState<Hud>({
    lat: 25,
    lng: 5,
    heading: 90,
    speedKmh: 0,
    nearest: null,
  })
  const [follow, setFollow] = useState(true)
  const [destination, setDestination] = useState<FlightCountry | null>(null)
  const [cargo, setCargo] = useState<FlightCargo | null>(null)
  const cargoRef = useRef<FlightCargo | null>(null)
  const [tradeMenuCountry, setTradeMenuCountry] = useState<FlightCountry | null>(null)
  const [tradePanelDismissed, setTradePanelDismissed] = useState(false)
  const [tradeError, setTradeError] = useState<string | null>(null)
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null)
  const deliveringRef = useRef(false)
  const homeDeliveryEdgeRef = useRef<() => void>(() => {})

  useEffect(() => {
    cargoRef.current = cargo
  }, [cargo])

  useEffect(() => {
    countriesRef.current = flightCountries
  }, [flightCountries])

  useEffect(() => {
    followRef.current = follow
  }, [follow])

  useEffect(() => {
    destinationRef.current = destination
  }, [destination])

  useEffect(() => {
    playerHomeKeyRef.current = playerHomeKey
  }, [playerHomeKey])

  useEffect(() => {
    hasCargoRef.current = cargo != null
  }, [cargo])

  const tryCompleteDelivery = useCallback(async () => {
    const c = cargoRef.current
    if (!c || deliveringRef.current || !playerCountryId) return
    deliveringRef.current = true
    setTradeError(null)
    setDeliveryStatus('Completing purchase…')
    try {
      await acceptOffer(c.offerId)
      setCargo(null)
      setDeliveryStatus('Delivered — treasury charged and cargo added to your stockpile.')
      window.setTimeout(() => setDeliveryStatus(null), 4000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not complete trade'
      setTradeError(msg)
      setDeliveryStatus(null)
    } finally {
      deliveringRef.current = false
    }
  }, [acceptOffer, playerCountryId])

  homeDeliveryEdgeRef.current = () => {
    void tryCompleteDelivery()
  }

  useEffect(() => {
    if (!hud.nearest || hud.nearest.km > NODE_HIT_KM + 25) {
      setTradePanelDismissed(false)
    }
  }, [hud.nearest])

  useEffect(() => {
    if (!hud.nearest || hud.nearest.km > NODE_HIT_KM) {
      setTradeMenuCountry(null)
      return
    }
    const hit = flightCountries.find((c) => c.key === hud.nearest!.key)
    if (!hit) return
    if (hit.isPlayer) {
      setTradeMenuCountry(null)
      return
    }
    setTradeMenuCountry(hit)
  }, [hud.nearest, flightCountries])

  useEffect(() => {
    if (!active) {
      keysRef.current.clear()
      extrasRef.current.drift = false
    }
  }, [active])

  useEffect(() => {
    if (!active) {
      keysRef.current.clear()
      return
    }
    const controlKeys = new Set(['w', 'a', 's', 'd', ' '])
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (controlKeys.has(k)) {
        e.preventDefault()
        keysRef.current.add(k)
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (controlKeys.has(k)) {
        e.preventDefault()
        keysRef.current.delete(k)
      }
    }
    const blur = () => keysRef.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      keysRef.current.clear()
    }
  }, [active])

  const sellerOffers = useMemo(() => {
    if (!tradeMenuCountry?.id) return []
    return offers.filter((o) => o.sellerId === tradeMenuCountry.id)
  }, [offers, tradeMenuCountry])

  const loadCargo = (offer: (typeof offers)[number]) => {
    if (cargo) {
      setTradeError('You already have cargo on board. Fly home to complete delivery.')
      return
    }
    const commodity = getCommodity(offer.commodityId, commodities)
    if (!commodity || !tradeMenuCountry?.id) return
    const total = offer.qty * offer.pricePerUnit
    if (playerCountry && playerCountry.balance < total) {
      setTradeError(`Need ${formatMoney(total)} in treasury; you have ${formatMoney(playerCountry.balance)}.`)
      return
    }
    setTradeError(null)
    setCargo({
      offerId: offer.id,
      sellerCountryId: offer.sellerId,
      commodityId: offer.commodityId,
      commoditySymbol: commodity.symbol,
      commodityName: commodity.name,
      qty: offer.qty,
      totalCost: total,
      sellerName: tradeMenuCountry.name,
      sellerFlag: tradeMenuCountry.flag,
    })
    setDeliveryStatus(`Loaded ${commodity.symbol} — fly home (${playerCountry?.flag ?? '🏠'} ${playerCountry?.name ?? 'your nation'}) to pay & receive.`)
    window.setTimeout(() => setDeliveryStatus(null), 5000)
  }

  const destDistance =
    destination != null
      ? haversineKm(hud.lat, hud.lng, destination.lat, destination.lng)
      : null

  const fireBoost = () => {
    extrasRef.current.boostUntilMs = performance.now() + BOOST_MS
  }

  const setDrift = (v: boolean) => {
    extrasRef.current.drift = v
  }

  return (
    <Panel
      title="Flight Deck"
      subtitle={`${flightCountries.length} destinations · WASD · dock at nodes to trade`}
      label="Navigation"
      spotlight
      className={cn('h-full min-h-0', className)}
      headerExtra={
        <button
          type="button"
          onClick={() => setFollow((f) => !f)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            follow
              ? 'border-[#5E6AD2]/30 bg-[#5E6AD2]/15 text-[#EDEDEF]'
              : 'border-white/10 bg-white/[0.04] text-[#8A8F98] hover:text-[#EDEDEF]',
          )}
        >
          <Crosshair className="h-3.5 w-3.5" />
          {follow ? 'Following' : 'Free cam'}
        </button>
      }
    >
      <div className="relative min-h-0 flex-1">
        <MapContainer
          center={[25, 5]}
          zoom={3}
          minZoom={2}
          maxZoom={7}
          worldCopyJump
          className="absolute inset-0 h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution="&copy; OSM"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <FlightLayer
            planeRef={planeRef}
            keysRef={keysRef}
            followRef={followRef}
            destinationRef={destinationRef}
            countriesRef={countriesRef}
            extrasRef={extrasRef}
            playerHomeKeyRef={playerHomeKeyRef}
            hasCargoRef={hasCargoRef}
            onHud={setHud}
            onUserDrag={() => setFollow(false)}
            onHomeDeliveryEdgeRef={homeDeliveryEdgeRef}
            active={active}
          />

          {flightCountries.map((country) => {
            const isDest = destination?.key === country.key
            const fill = country.isPlayer
              ? tokens.color.accent
              : isDest
                ? tokens.color.accentBright
                : '#3f3f46'
            return (
              <CircleMarker
                key={country.key}
                center={[country.lat, country.lng]}
                radius={country.isPlayer ? 13 : isDest ? 11 : 7}
                pathOptions={{
                  color: isDest ? tokens.color.accentBright : 'rgba(255,255,255,0.35)',
                  fillColor: fill,
                  fillOpacity: country.isPlayer || isDest ? 1 : 0.7,
                  weight: isDest ? 2.5 : 1,
                }}
                eventHandlers={{
                  click: () => setDestination(country),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="text-xs">
                    <div className="font-semibold">
                      {country.flag} {country.name}
                    </div>
                    <div className="text-[#8A8F98]">{country.region}</div>
                    {country.gdpScore != null && (
                      <div className="font-medium text-[#5E6AD2]">
                        GDP {formatMoney(country.gdpScore, true)}
                      </div>
                    )}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="flight-popup">
                    <div className="flight-popup__title">
                      {country.flag} {country.name}
                    </div>
                    <div className="flight-popup__sub">{country.region}</div>
                    <button
                      type="button"
                      className="flight-popup__btn"
                      onClick={() => setDestination(country)}
                    >
                      Set as destination
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* Cargo + status — top right */}
        <div className="pointer-events-none absolute right-3 top-3 z-[500] flex max-w-[min(100%,18rem)] flex-col items-end gap-2">
          {cargo && (
            <div className="pointer-events-auto rounded-xl border border-emerald-500/25 bg-[#050506]/90 px-3 py-2.5 text-left shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/90">
                <Package className="h-3.5 w-3.5" />
                Onboard cargo
              </div>
              <div className="mt-1 text-sm font-semibold text-[#EDEDEF]">
                {cargo.commoditySymbol} · {formatQty(cargo.qty)} {cargo.commodityName}
              </div>
              <div className="mt-0.5 text-[11px] text-[#8A8F98]">
                From {cargo.sellerFlag} {cargo.sellerName}
              </div>
              <div className="mt-1 font-mono text-xs text-[#EDEDEF]">
                Due at home: {formatMoney(cargo.totalCost)}
              </div>
            </div>
          )}
          {(deliveryStatus || tradeError) && (
            <div
              className={cn(
                'pointer-events-auto rounded-lg border px-3 py-2 text-[11px] backdrop-blur-md',
                tradeError
                  ? 'border-red-500/30 bg-red-950/40 text-red-200'
                  : 'border-white/[0.08] bg-[#050506]/90 text-[#EDEDEF]',
              )}
            >
              {tradeError ?? deliveryStatus}
            </div>
          )}
        </div>

        {/* HUD — top left */}
        <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-col gap-2">
          <div className="pointer-events-auto rounded-xl border border-white/[0.08] bg-[#050506]/85 px-3 py-2.5 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <HudRow icon={<MapPin className="h-3 w-3" />} label="Position">
                {hud.lat.toFixed(2)}°, {hud.lng.toFixed(2)}°
              </HudRow>
              <HudRow icon={<Navigation className="h-3 w-3" />} label="Heading">
                {Math.round(hud.heading)}° {compassLabel(hud.heading)}
              </HudRow>
              <HudRow icon={<Gauge className="h-3 w-3" />} label="Speed">
                {Math.round(hud.speedKmh).toLocaleString()} km/h
              </HudRow>
              <HudRow icon={<Plane className="h-3 w-3" />} label="Nearest">
                {hud.nearest
                  ? `${hud.nearest.flag} ${Math.round(hud.nearest.km).toLocaleString()} km`
                  : '—'}
              </HudRow>
            </div>
          </div>

          {destination && (
            <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-[#5E6AD2]/25 bg-[#5E6AD2]/10 px-3 py-2 backdrop-blur-md">
              <div className="text-[11px]">
                <div className="font-semibold text-[#EDEDEF]">
                  {destination.flag} {destination.name}
                </div>
                <div className="text-[#8A8F98]">
                  {destDistance != null && destDistance < 120
                    ? 'Arrived — welcome!'
                    : `${Math.round(destDistance ?? 0).toLocaleString()} km · bearing ${Math.round(
                        bearingDeg(hud.lat, hud.lng, destination.lat, destination.lng) < 0
                          ? bearingDeg(hud.lat, hud.lng, destination.lat, destination.lng) + 360
                          : bearingDeg(hud.lat, hud.lng, destination.lat, destination.lng),
                      )}°`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDestination(null)}
                className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-[#8A8F98] transition-colors hover:text-[#EDEDEF]"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Trade exchange panel — docked at foreign country */}
        {tradeMenuCountry && !tradePanelDismissed && hud.nearest && hud.nearest.km <= NODE_HIT_KM && (
          <div className="pointer-events-auto absolute bottom-20 left-1/2 z-[600] w-[min(100%,22rem)] -translate-x-1/2 rounded-xl border border-white/[0.1] bg-[#0a0a0c]/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
                  Exchange
                </div>
                <div className="text-base font-semibold text-[#EDEDEF]">
                  {tradeMenuCountry.flag} {tradeMenuCountry.name}
                </div>
                <div className="text-xs text-[#8A8F98]">{tradeMenuCountry.region}</div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-[#8A8F98] hover:bg-white/[0.06] hover:text-[#EDEDEF]"
                aria-label="Close"
                onClick={() => setTradePanelDismissed(true)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!connected || !tradeMenuCountry.id ? (
              <p className="mt-3 text-sm text-[#8A8F98]">
                Connect to SpacetimeDB and publish the <code className="text-[#5E6AD2]">nations</code> module to
                trade for real. Or use the Exchange tab after connecting.
              </p>
            ) : sellerOffers.length === 0 ? (
              <p className="mt-3 text-sm text-[#8A8F98]">No open sell offers from this nation right now.</p>
            ) : (
              <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto scroll-subtle pr-1">
                {sellerOffers.map((offer) => {
                  const commodity = getCommodity(offer.commodityId, commodities)
                  const total = offer.qty * offer.pricePerUnit
                  const can =
                    playerCountry != null &&
                    playerCountry.balance >= total &&
                    !cargo &&
                    playerCountryId != null &&
                    offer.sellerId !== playerCountryId
                  return (
                    <li
                      key={idStr(offer.id)}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#EDEDEF]">{commodity?.symbol ?? '?'}</span>
                        <span className="text-xs text-[#8A8F98]">{formatQty(offer.qty)} @ {formatPrice(offer.pricePerUnit)}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#8A8F98]">Total {formatMoney(total)}</div>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-2 w-full"
                        disabled={!can}
                        onClick={() => loadCargo(offer)}
                      >
                        Load for delivery
                      </Button>
                      {!can && playerCountry && offer.sellerId === playerCountryId && (
                        <p className="mt-1 text-[10px] text-[#8A8F98]">This is your own listing.</p>
                      )}
                      {!can && playerCountry && playerCountry.balance < total && (
                        <p className="mt-1 text-[10px] text-red-400/90">Insufficient treasury for this haul.</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            {cargo && (
              <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-[#8A8F98]">
                Cargo loaded — leave the node and fly to your capital to finalize: funds and stock update on arrival.
              </p>
            )}
          </div>
        )}

        {/* Boost / Drift + WASD */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] flex -translate-x-1/2 flex-col items-center gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={fireBoost}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold text-amber-100 shadow-sm transition-colors hover:bg-amber-500/25"
            >
              <Zap className="h-3.5 w-3.5" />
              Boost
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/35 bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-100 shadow-sm transition-colors hover:bg-sky-500/25 aria-pressed:bg-sky-500/30"
              onPointerDown={(e) => {
                e.stopPropagation()
                setDrift(true)
              }}
              onPointerUp={(e) => {
                e.stopPropagation()
                setDrift(false)
              }}
              onPointerLeave={() => setDrift(false)}
            >
              <Wind className="h-3.5 w-3.5" />
              Drift (hold)
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#050506]/85 px-3 py-1.5 text-[10px] text-[#8A8F98] backdrop-blur-md">
            <Key>W</Key>
            <span>throttle</span>
            <Key>S</Key>
            <span>reverse</span>
            <Key>A</Key>
            <Key>D</Key>
            <span>turn</span>
            <Key>Space</Key>
            <span>brake</span>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function HudRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-[#8A8F98]">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[#EDEDEF]">{children}</div>
    </div>
  )
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-[#EDEDEF]">
      {children}
    </kbd>
  )
}
