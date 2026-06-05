import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { formatQty, getPort } from '../../lib/utils'

export function FleetPanel() {
  const { state, currentPlayerId, dispatchShip, now } = useGame()
  const [dispatching, setDispatching] = useState<string | null>(null)

  const myShips = state.ships.filter((s) => s.ownerId === currentPlayerId)

  const handleDispatch = (shipId: string, destPortId: string) => {
    dispatchShip(shipId, destPortId)
    setDispatching(null)
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header">
        <span>My Fleet</span>
        <span className="font-mono text-[10px] normal-case tracking-normal">
          {myShips.length} vessels
        </span>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {myShips.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--text-muted)]">
            No ships owned
          </div>
        ) : (
          myShips.map((ship) => {
            const port = getPort(ship.currentPortId, state.ports)
            const route = state.routes.find(
              (r) => r.shipId === ship.id && r.status === 'in_transit',
            )
            const destPort = route
              ? getPort(route.destPortId, state.ports)
              : null
            const etaSec = route
              ? Math.max(0, Math.ceil((route.eta - now) / 1000))
              : null

            return (
              <div
                key={ship.id}
                className="border-b border-[var(--border)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{ship.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {ship.status === 'in_transit' && destPort
                        ? `En route to ${destPort.name} · ETA ${etaSec}s`
                        : `At ${port?.name ?? 'unknown'}`}
                    </div>
                  </div>
                  <StatusBadge status={ship.status} />
                </div>

                <div className="mt-2 flex gap-3 font-mono text-[10px] text-[var(--text-muted)]">
                  <span>Cargo: {formatQty(ship.cargoQty)}t</span>
                  <span>{ship.cargoType}</span>
                </div>

                {ship.status !== 'in_transit' && (
                  <div className="mt-2">
                    {dispatching === ship.id ? (
                      <div className="space-y-2">
                        <select
                          id={`dest-${ship.id}`}
                          className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select destination…
                          </option>
                          {state.ports
                            .filter((p) => p.id !== ship.currentPortId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const sel = document.getElementById(
                                `dest-${ship.id}`,
                              ) as HTMLSelectElement
                              if (sel?.value) handleDispatch(ship.id, sel.value)
                            }}
                            className="flex-1 rounded bg-[var(--accent)] py-1 text-[10px] font-semibold text-white"
                          >
                            Dispatch
                          </button>
                          <button
                            type="button"
                            onClick={() => setDispatching(null)}
                            className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-muted)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDispatching(ship.id)}
                        className="w-full rounded border border-[var(--accent-dim)] py-1 text-[10px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10"
                      >
                        Dispatch Ship
                      </button>
                    )}
                  </div>
                )}

                {route && (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full bg-[var(--amber)] transition-all"
                      style={{
                        width: `${Math.min(100, ((now - route.departedAt) / (route.eta - route.departedAt)) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-[var(--green)]/20 text-[var(--green)]',
    loading: 'bg-[var(--amber)]/20 text-[var(--amber)]',
    in_transit: 'bg-[var(--accent)]/20 text-[var(--accent)]',
  }

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${colors[status] ?? ''}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
