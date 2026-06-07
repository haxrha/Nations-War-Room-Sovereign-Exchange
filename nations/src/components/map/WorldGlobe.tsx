import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { useGame, type Country } from '../../context/GameContext'
import { formatMoney, getCommodity, getCountry, idStr } from '../../lib/utils'
import { CountryGlobeDetail } from './CountryGlobeDetail'
import { GlobeCountryList } from './GlobeCountryList'
import { GlobeControls } from './GlobeControls'
import { Panel } from '../ui/Panel'
import { cn } from '../../lib/cn'

const COMMODITY_ARC_COLORS: Record<string, string> = {
  OIL: '#f59e0b',
  GRN: '#22c55e',
  STL: '#94a3b8',
  ELC: '#60a5fa',
  REE: '#a78bfa',
}

const DEFAULT_POV = { lat: 20, lng: 0, altitude: 2.2 }

function arcColorForCommodity(symbol: string | undefined): string {
  if (!symbol) return '#60a5fa'
  return COMMODITY_ARC_COLORS[symbol] ?? '#60a5fa'
}

type GlobePoint = {
  id: string
  lat: number
  lng: number
  name: string
  flag: string
  gdpScore: number
  isPlayer: boolean
  isBot: boolean
  size: number
  altitude: number
  color: string
}

type GlobeArc = {
  id: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
  dashLength: number
  stroke: number
}

function pointColor(country: Country, isPlayer: boolean, isSelected: boolean, maxGdp: number): string {
  if (isPlayer) return 'rgba(127, 119, 221, 0.95)'
  if (isSelected) return 'rgba(45, 212, 191, 0.95)'
  if (!country.isBot) return 'rgba(96, 165, 250, 0.85)'
  const cap = Math.max(maxGdp, 500_000)
  const intensity = Math.min(country.gdpScore / cap, 1)
  return `rgba(29, 158, 117, ${0.35 + intensity * 0.55})`
}

export function WorldGlobe({
  active = true,
  className,
  onCountryClick,
}: {
  active?: boolean
  className?: string
  onCountryClick?: (country: Country) => void
}) {
  const { countries, offers, tradeHistory, commodities, playerCountryId } = useGame()
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 })
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)

  const maxGdp = useMemo(
    () => Math.max(1, ...countries.map((c) => c.gdpScore)),
    [countries],
  )

  const playerCountry = useMemo(
    () => (playerCountryId != null ? countries.find((c) => c.id === playerCountryId) : undefined),
    [countries, playerCountryId],
  )

  const flyToCountry = useCallback((country: Country, altitude = 1.6) => {
    globeRef.current?.pointOfView(
      { lat: country.lat, lng: country.lng, altitude },
      900,
    )
  }, [])

  const selectCountry = useCallback(
    (country: Country) => {
      setSelectedCountry(country)
      flyToCountry(country)
      onCountryClick?.(country)
    },
    [flyToCountry, onCountryClick],
  )

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 0.35
    controls.enablePan = true
    controls.minDistance = 120
    controls.maxDistance = 400
  }, [active, dimensions, autoRotate])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect
      if (width > 0 && height > 0) setDimensions({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (active && playerCountry && !selectedCountry) {
      const t = window.setTimeout(() => flyToCountry(playerCountry, 2), 600)
      return () => window.clearTimeout(t)
    }
  }, [active, playerCountry, selectedCountry, flyToCountry])

  const points = useMemo<GlobePoint[]>(() => {
    return countries.map((country) => {
      const isPlayer = playerCountryId != null && country.id === playerCountryId
      const isSelected = selectedCountry?.id === country.id
      const intensity = Math.min(country.gdpScore / maxGdp, 1)
      return {
        id: idStr(country.id),
        lat: country.lat,
        lng: country.lng,
        name: country.name,
        flag: country.flag,
        gdpScore: country.gdpScore,
        isPlayer,
        isBot: country.isBot,
        size: isPlayer ? 0.6 : isSelected ? 0.55 : 0.38 + intensity * 0.18,
        altitude: isSelected ? 0.08 : isPlayer ? 0.05 : 0.012 + intensity * 0.02,
        color: pointColor(country, isPlayer, isSelected, maxGdp),
      }
    })
  }, [countries, playerCountryId, maxGdp, selectedCountry])

  const offerArcs = useMemo<GlobeArc[]>(() => {
    return offers.slice(0, 16).flatMap((offer) => {
      const seller = getCountry(offer.sellerId, countries)
      if (!seller) return []
      const commodity = getCommodity(offer.commodityId, commodities)
      const offset = (Number(offer.commodityId) % 7) - 3
      return [
        {
          id: `offer-${idStr(offer.id)}`,
          startLat: seller.lat,
          startLng: seller.lng,
          endLat: seller.lat + offset * 2.5,
          endLng: seller.lng + offset * 4,
          color: arcColorForCommodity(commodity?.symbol),
          dashLength: 0.4,
          stroke: 0.5,
        },
      ]
    })
  }, [offers, countries, commodities])

  const tradeArcs = useMemo<GlobeArc[]>(() => {
    return tradeHistory.slice(0, 10).flatMap((trade) => {
      const seller = getCountry(trade.sellerId, countries)
      const buyer = getCountry(trade.buyerId, countries)
      if (!seller || !buyer) return []
      const commodity = getCommodity(trade.commodityId, commodities)
      return [
        {
          id: `trade-${idStr(trade.id)}`,
          startLat: seller.lat,
          startLng: seller.lng,
          endLat: buyer.lat,
          endLng: buyer.lng,
          color: arcColorForCommodity(commodity?.symbol),
          dashLength: 0.55,
          stroke: 0.75,
        },
      ]
    })
  }, [tradeHistory, countries, commodities])

  const arcs = useMemo(() => [...offerArcs, ...tradeArcs], [offerArcs, tradeArcs])
  const onlineCount = countries.filter((c) => c.online).length

  return (
    <Panel
      title="World Globe"
      subtitle={`${countries.length} nations · ${onlineCount} online · click or search to inspect`}
      label="Geography"
      spotlight
      className={cn('h-full min-h-0', className)}
    >
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 bg-[#020203]"
        onMouseEnter={() => {
          if (globeRef.current) globeRef.current.controls().autoRotate = false
        }}
        onMouseLeave={() => {
          if (globeRef.current) globeRef.current.controls().autoRotate = autoRotate
        }}
      >
        {active && (
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            atmosphereColor="#1a9e75"
            atmosphereAltitude={0.25}
            animateIn
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude="altitude"
            pointRadius="size"
            pointsMerge
            pointLabel={(d: object) => {
              const p = d as GlobePoint
              const kind = p.isPlayer ? 'Your nation' : p.isBot ? 'AI nation' : 'Human player'
              return `<div class="globe-tooltip"><strong>${p.flag} ${p.name}</strong><br/><span style="color:#94a3b8">${kind}</span><br/>GDP ${formatMoney(p.gdpScore, true)}<br/><span style="color:#64748b;font-size:10px">Click for details</span></div>`
            }}
            onPointClick={(d: object) => {
              const p = d as GlobePoint
              const country = countries.find((c) => idStr(c.id) === p.id)
              if (country) selectCountry(country)
            }}
            arcsData={arcs}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor={(d: object) => (d as GlobeArc).color}
            arcDashLength={(d: object) => (d as GlobeArc).dashLength}
            arcStroke={(d: object) => (d as GlobeArc).stroke}
            arcDashGap={0.2}
            arcDashAnimateTime={1500}
            arcAltitude={0.3}
          />
        )}

        <GlobeCountryList
          selectedId={selectedCountry?.id ?? null}
          onSelect={selectCountry}
        />

        <GlobeControls
          autoRotate={autoRotate}
          onToggleRotate={() => setAutoRotate((v) => !v)}
          onFocusPlayer={() => playerCountry && selectCountry(playerCountry)}
          onResetView={() => {
            setSelectedCountry(null)
            globeRef.current?.pointOfView(DEFAULT_POV, 900)
          }}
          hasPlayer={playerCountry != null}
        />

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-lg border border-[#1a9e75]/20 bg-[#0a0e1a]/85 px-3 py-2 text-[10px] text-[#64748b] backdrop-blur-md md:max-w-xs">
          <span className="font-mono uppercase tracking-widest">Legend</span>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[#e2e8f0]">
            <LegendDot color="#7f77dd" label="You" />
            <LegendDot color="#60a5fa" label="Human" />
            <LegendDot color="#1d9e75" label="AI bot" />
            <LegendDot color="#2dd4bf" label="Selected" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 border-t border-white/[0.06] pt-2">
            {Object.entries(COMMODITY_ARC_COLORS).map(([sym, color]) => (
              <span key={sym} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {sym}
              </span>
            ))}
          </div>
        </div>

        {selectedCountry && (
          <CountryGlobeDetail
            country={selectedCountry}
            onClose={() => setSelectedCountry(null)}
          />
        )}
      </div>
    </Panel>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
