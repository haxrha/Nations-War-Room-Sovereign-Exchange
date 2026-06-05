import { useGame } from '../../context/GameContext'
import {
  COMMODITY,
  congestionColor,
  congestionLabel,
  formatPrice,
} from '../../lib/utils'

export function PortDashboard() {
  const { state, selectedPortId, setSelectedPort } = useGame()
  const port = state.ports.find((p) => p.id === selectedPortId)
  const spot = state.spotPrices.find((s) => s.portId === selectedPortId)

  const approaching = state.routes
    .filter(
      (r) => r.destPortId === selectedPortId && r.status === 'in_transit',
    )
    .map((r) => {
      const ship = state.ships.find((s) => s.id === r.shipId)
      return { route: r, ship }
    })

  const pendingOrders = state.orders.filter((o) => o.portId === selectedPortId)

  if (!port) return null

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <span>Port Dashboard</span>
      </div>
      <div className="p-3">
        <select
          value={selectedPortId}
          onChange={(e) => setSelectedPort(e.target.value)}
          className="mb-3 w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
        >
          {state.ports.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.region})
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Spot Price" value={formatPrice(spot?.price ?? port.basePrice)} accent />
          <Stat label="Commodity" value={COMMODITY} />
          <Stat
            label="Congestion"
            value={congestionLabel(port.congestion)}
            valueColor={congestionColor(port.congestion)}
          />
          <Stat label="Open Orders" value={String(pendingOrders.length)} />
        </div>

        {approaching.length > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Incoming ({approaching.length})
            </div>
            <div className="space-y-1">
              {approaching.map(({ route, ship }) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between rounded bg-[var(--bg-elevated)] px-2 py-1.5 text-[10px]"
                >
                  <span>{ship?.name ?? 'Unknown'}</span>
                  <span className="font-mono text-[var(--amber)]">
                    ETA {Math.max(0, Math.ceil((route.eta - Date.now()) / 1000))}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  valueColor,
}: {
  label: string
  value: string
  accent?: boolean
  valueColor?: string
}) {
  return (
    <div className="rounded bg-[var(--bg-elevated)] px-2 py-2">
      <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
      <div
        className={`font-mono text-sm font-semibold ${accent ? 'text-[var(--accent)]' : ''}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
    </div>
  )
}
