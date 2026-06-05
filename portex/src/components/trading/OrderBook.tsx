import { useGame } from '../../context/GameContext'
import { COMMODITY, formatPrice, formatQty, formatTimeAgo } from '../../lib/utils'

export function OrderBook() {
  const { state, selectedPortId, currentPlayerId, cancelOrder, now } = useGame()

  const portOrders = state.orders
    .filter((o) => o.portId === selectedPortId && o.commodity === COMMODITY)
    .sort((a, b) => b.createdAt - a.createdAt)

  const bids = portOrders
    .filter((o) => o.side === 'buy')
    .sort((a, b) => b.bidPrice - a.bidPrice)
  const asks = portOrders
    .filter((o) => o.side === 'sell')
    .sort((a, b) => a.bidPrice - b.bidPrice)

  const spot = state.spotPrices.find((s) => s.portId === selectedPortId)
  const port = state.ports.find((p) => p.id === selectedPortId)
  const spread =
    bids[0] && asks[0] ? asks[0].bidPrice - bids[0].bidPrice : null

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header">
        <span>Order Book</span>
        <span className="font-mono text-[10px] normal-case tracking-normal">
          {port?.name} · {COMMODITY}
        </span>
      </div>

      <div className="border-b border-[var(--border)] px-3 py-2">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-lg font-semibold text-[var(--accent)]">
            {formatPrice(spot?.price ?? port?.basePrice ?? 0)}
          </span>
          {spread !== null && (
            <span className="text-[10px] text-[var(--text-muted)]">
              Spread {formatPrice(spread)}
            </span>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-[var(--border)]">
        <OrderSide
          title="Bids"
          color="var(--green)"
          orders={bids}
          players={state.players}
          currentPlayerId={currentPlayerId}
          onCancel={cancelOrder}
          now={now}
        />
        <OrderSide
          title="Asks"
          color="var(--red)"
          orders={asks}
          players={state.players}
          currentPlayerId={currentPlayerId}
          onCancel={cancelOrder}
          now={now}
        />
      </div>
    </div>
  )
}

function OrderSide({
  title,
  color,
  orders,
  players,
  currentPlayerId,
  onCancel,
  now,
}: {
  title: string
  color: string
  orders: {
    id: string
    playerId: string
    bidPrice: number
    qty: number
    createdAt: number
  }[]
  players: { id: string; name: string }[]
  currentPlayerId: string
  onCancel: (id: string) => void
  now: number
}) {
  const maxQty = Math.max(...orders.map((o) => o.qty), 1)

  return (
    <div className="flex min-h-0 flex-col">
      <div
        className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color }}
      >
        {title}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="px-3 py-4 text-center text-[10px] text-[var(--text-muted)]">
            No orders
          </div>
        ) : (
          orders.map((order) => {
            const player = players.find((p) => p.id === order.playerId)
            const isOwn = order.playerId === currentPlayerId
            const depthPct = (order.qty / maxQty) * 100

            return (
              <div
                key={order.id}
                className="group relative border-b border-[var(--border)]/50 px-3 py-1.5"
              >
                <div
                  className="absolute inset-y-0 left-0 opacity-10"
                  style={{
                    width: `${depthPct}%`,
                    backgroundColor: color,
                  }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium" style={{ color }}>
                    {formatPrice(order.bidPrice)}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {formatQty(order.qty)}
                  </span>
                </div>
                <div className="relative flex items-center justify-between">
                  <span className="truncate text-[9px] text-[var(--text-muted)]">
                    {player?.name ?? 'Unknown'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-[var(--text-muted)]">
                      {formatTimeAgo(order.createdAt, now)}
                    </span>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => onCancel(order.id)}
                        className="hidden text-[9px] text-[var(--red)] group-hover:inline"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
