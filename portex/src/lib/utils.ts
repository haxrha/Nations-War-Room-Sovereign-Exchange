import { COMMODITY, PORTS } from '../data/mockData'
import type { Port, Route, Ship, ShipPosition } from '../types'

export function getPort(portId: string, ports: Port[]): Port | undefined {
  return ports.find((p) => p.id === portId)
}

export function interpolatePosition(
  origin: Port,
  dest: Port,
  progress: number,
): { lat: number; lng: number } {
  const t = Math.min(1, Math.max(0, progress))
  return {
    lat: origin.lat + (dest.lat - origin.lat) * t,
    lng: origin.lng + (dest.lng - origin.lng) * t,
  }
}

export function computeShipPositions(
  ships: Ship[],
  routes: Route[],
  ports: Port[],
  now: number,
): ShipPosition[] {
  const positions: ShipPosition[] = []

  for (const ship of ships) {
    const activeRoute = routes.find(
      (r) => r.shipId === ship.id && r.status === 'in_transit',
    )

    if (activeRoute) {
      const origin = getPort(activeRoute.originPortId, ports)
      const dest = getPort(activeRoute.destPortId, ports)
      if (!origin || !dest) continue

      const duration = activeRoute.eta - activeRoute.departedAt
      const elapsed = now - activeRoute.departedAt
      const progress = duration > 0 ? elapsed / duration : 1
      const { lat, lng } = interpolatePosition(origin, dest, progress)

      positions.push({
        shipId: ship.id,
        shipName: ship.name,
        ownerId: ship.ownerId,
        lat,
        lng,
        cargoType: ship.cargoType,
        destPortName: dest.name,
        progress: Math.min(1, progress),
      })
    } else if (ship.status === 'idle' || ship.status === 'loading') {
      const port = getPort(ship.currentPortId, ports)
      if (!port) continue
      positions.push({
        shipId: ship.id,
        shipName: ship.name,
        ownerId: ship.ownerId,
        lat: port.lat,
        lng: port.lng,
        cargoType: ship.cargoType,
        destPortName: port.name,
        progress: 0,
      })
    }
  }

  return positions
}

export function estimateTransitMs(originId: string, destId: string): number {
  const origin = PORTS.find((p) => p.id === originId)
  const dest = PORTS.find((p) => p.id === destId)
  if (!origin || !dest) return 90_000

  const dLat = dest.lat - origin.lat
  const dLng = dest.lng - origin.lng
  const distance = Math.sqrt(dLat * dLat + dLng * dLng)
  return Math.round(60_000 + distance * 8_000)
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

export function formatQty(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatTimeAgo(ts: number, now: number): string {
  const sec = Math.floor((now - ts) / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

export function congestionLabel(level: number): string {
  if (level < 0.25) return 'Low'
  if (level < 0.5) return 'Moderate'
  if (level < 0.75) return 'High'
  return 'Critical'
}

export function congestionColor(level: number): string {
  if (level < 0.25) return '#22c55e'
  if (level < 0.5) return '#f59e0b'
  if (level < 0.75) return '#f97316'
  return '#ef4444'
}

export { COMMODITY }
