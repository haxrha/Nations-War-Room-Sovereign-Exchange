import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { useGame } from '../../context/GameContext'
import {
  computeShipPositions,
  congestionColor,
  congestionLabel,
  formatPrice,
  getPort,
} from '../../lib/utils'

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export function WorldMap() {
  const { state, selectedPortId, setSelectedPort, now } = useGame()
  const shipPositions = computeShipPositions(
    state.ships,
    state.routes,
    state.ports,
    now,
  )

  const activeRoutes = state.routes.filter((r) => r.status === 'in_transit')

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header">
        <span>World Map</span>
        <span className="font-mono text-[10px] normal-case tracking-normal text-[var(--text-muted)]">
          {shipPositions.length} vessels · {activeRoutes.length} active routes
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={8}
          className="h-full w-full"
          zoomControl={false}
        >
          <MapResizer />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {state.ports.map((port) => {
            const spot = state.spotPrices.find((s) => s.portId === port.id)
            const isSelected = port.id === selectedPortId
            const radius = 6 + port.congestion * 8

            return (
              <CircleMarker
                key={port.id}
                center={[port.lat, port.lng]}
                radius={isSelected ? radius + 3 : radius}
                pathOptions={{
                  color: isSelected ? '#3b9eff' : congestionColor(port.congestion),
                  fillColor: isSelected ? '#3b9eff' : congestionColor(port.congestion),
                  fillOpacity: isSelected ? 0.9 : 0.65,
                  weight: isSelected ? 2 : 1,
                }}
                eventHandlers={{
                  click: () => setSelectedPort(port.id),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div className="text-xs">
                    <div className="font-semibold">{port.name}</div>
                    <div className="text-[var(--text-muted)]">{port.region}</div>
                    <div className="font-mono">
                      {formatPrice(spot?.price ?? port.basePrice)}
                    </div>
                    <div style={{ color: congestionColor(port.congestion) }}>
                      Congestion: {congestionLabel(port.congestion)}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}

          {activeRoutes.map((route) => {
            const origin = getPort(route.originPortId, state.ports)
            const dest = getPort(route.destPortId, state.ports)
            if (!origin || !dest) return null
            return (
              <Polyline
                key={route.id}
                positions={[
                  [origin.lat, origin.lng],
                  [dest.lat, dest.lng],
                ]}
                pathOptions={{
                  color: '#3b9eff',
                  weight: 1.5,
                  opacity: 0.35,
                  dashArray: '6 8',
                }}
              />
            )
          })}

          {shipPositions.map((ship) => (
            <CircleMarker
              key={ship.shipId}
              center={[ship.lat, ship.lng]}
              radius={5}
              pathOptions={{
                color: '#fff',
                fillColor: ship.progress > 0 ? '#f59e0b' : '#22c55e',
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip direction="right" offset={[8, 0]} opacity={0.95}>
                <div className="text-xs">
                  <div className="font-semibold">{ship.shipName}</div>
                  {ship.progress > 0 ? (
                    <div>
                      → {ship.destPortName} ({Math.round(ship.progress * 100)}%)
                    </div>
                  ) : (
                    <div>At port · {ship.cargoType}</div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
