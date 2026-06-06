import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import { computeGdpProxy, formatMoney, getCountry, interpolateRoute } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { accentAt } from '../../lib/design-system'
import type { Country } from '../../types'

const MAP_ACCENTS = ['#FF3AF2', '#00F5D4', '#FFE600', '#FF6B35', '#7B2FFF']

function RouteLayer({ from, to, pos, color }: { from: Country; to: Country; pos: { lat: number; lng: number }; color: string }) {
  return (
    <>
      <Polyline positions={[[from.lat, from.lng], [to.lat, to.lng]]} pathOptions={{ color, weight: 3, opacity: 0.55, dashArray: '8 10' }} />
      <CircleMarker center={[pos.lat, pos.lng]} radius={6} pathOptions={{ color: '#fff', fillColor: color, fillOpacity: 1, weight: 3 }}>
        <Tooltip direction="right"><span className="font-heading text-xs font-bold uppercase">{from.flag} → {to.flag} 🚢</span></Tooltip>
      </CircleMarker>
    </>
  )
}

function MapResizer() {
  const map = useMap()
  useEffect(() => { const t = setTimeout(() => map.invalidateSize(), 100); return () => clearTimeout(t) }, [map])
  return null
}

export function WorldMap() {
  const { state, now } = useGame()
  const player = state.playerCountryId
  const activeRoutes = state.routes.map((route) => {
    const from = getCountry(route.fromCountryId, state.countries)
    const to = getCountry(route.toCountryId, state.countries)
    if (!from || !to) return null
    const progress = (now - route.startedAt) / (route.completesAt - route.startedAt)
    return { route, from, to, pos: interpolateRoute(from, to, progress) }
  }).filter(Boolean)

  return (
    <Panel title="World Map" subtitle={`${state.countries.length} nations · ${activeRoutes.length} shipments`} accentIndex={0} emoji="🌍" rotate={false} className="shadow-multi-lg">
      <div className="relative min-h-[280px] flex-1 lg:min-h-0">
        <MapContainer center={[20, 10]} zoom={2} minZoom={2} maxZoom={6} className="h-full w-full rounded-b-3xl" zoomControl={false}>
          <MapResizer />
          <TileLayer attribution='&copy; OSM' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {state.countries.map((country, i) => {
            const isPlayer = country.id === player
            const color = MAP_ACCENTS[i % MAP_ACCENTS.length]
            return (
              <CircleMarker key={country.id} center={[country.lat, country.lng]} radius={isPlayer ? 16 : 11}
                pathOptions={{ color: isPlayer ? '#FFE600' : '#fff', fillColor: color, fillOpacity: 0.9, weight: isPlayer ? 4 : 2 }}>
                <Tooltip direction="top" offset={[0, -12]}>
                  <div className="font-body text-xs">
                    <div className="font-heading text-sm font-black uppercase">{country.flag} {country.name}</div>
                    <div className="text-white/70">{country.region}</div>
                    <div className="font-heading font-bold" style={{ color }}>GDP {formatMoney(computeGdpProxy(country.id, state), true)}</div>
                    {country.isBot && <div className="text-[10px] italic text-[#00F5D4]">🤖 {country.personality.replace(/_/g, ' ')}</div>}
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}
          {activeRoutes.map((item, i) => item && <RouteLayer key={item.route.id} from={item.from} to={item.to} pos={item.pos} color={accentAt(i + 1)} />)}
        </MapContainer>
      </div>
    </Panel>
  )
}
