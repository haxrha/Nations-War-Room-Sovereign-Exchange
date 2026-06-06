import { useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { useGame, type Country } from '../../context/GameContext'
import { formatMoney, getCommodity, getCountry, idStr } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { tokens } from '../../lib/design-system'
import { cn } from '../../lib/cn'

const COMMODITY_ARC_COLORS: Record<string, string> = {
  OIL: '#f59e0b',
  GRN: '#22c55e',
  STL: '#94a3b8',
  ELC: '#60a5fa',
  REE: '#a78bfa',
}

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

function pointColor(country: Country, isPlayer: boolean): string {
  if (isPlayer) return 'rgba(127, 119, 221, 0.95)'
  const intensity = Math.min(country.gdpScore / 100_000, 1)
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

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4
  }, [active, dimensions])

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

  const points = useMemo<GlobePoint[]>(() => {
    return countries.map((country) => {
      const isPlayer = playerCountryId != null && country.id === playerCountryId
      const intensity = Math.min(country.gdpScore / 100_000, 1)
      return {
        id: idStr(country.id),
        lat: country.lat,
        lng: country.lng,
        name: country.name,
        flag: country.flag,
        gdpScore: country.gdpScore,
        isPlayer,
        size: isPlayer ? 0.55 : 0.35 + intensity * 0.2,
        altitude: 0.01 + intensity * 0.02,
        color: pointColor(country, isPlayer),
      }
    })
  }, [countries, playerCountryId])

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
      subtitle={`${countries.length} nations · ${onlineCount} online · ${offers.length} open offers`}
      label="Geography"
      spotlight
      className={cn('h-full min-h-0', className)}
    >
      <div ref={containerRef} className="relative min-h-0 flex-1 bg-[#020203]">
        {active && (
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            atmosphereColor="#1D9E75"
            atmosphereAltitude={0.15}
            animateIn
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude="altitude"
            pointRadius="size"
            pointLabel={(d: object) => {
              const p = d as GlobePoint
              return `<div class="globe-tooltip"><strong>${p.flag} ${p.name}</strong><br/>GDP ${formatMoney(p.gdpScore, true)}</div>`
            }}
            onPointClick={(d: object) => {
              const p = d as GlobePoint
              const country = countries.find((c) => idStr(c.id) === p.id)
              if (country) onCountryClick?.(country)
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

        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-white/[0.08] bg-[#050506]/80 px-3 py-2 text-[10px] text-[#8A8F98] backdrop-blur-md">
          <span className="font-mono-label uppercase tracking-widest">Live trade arcs</span>
          <div className="mt-1 flex flex-wrap gap-2 text-[#EDEDEF]">
            {Object.entries(COMMODITY_ARC_COLORS).map(([sym, color]) => (
              <span key={sym} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {sym}
              </span>
            ))}
          </div>
          {playerCountryId != null && (
            <div className="mt-1.5" style={{ color: tokens.color.accent }}>
              ● Your nation
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}
