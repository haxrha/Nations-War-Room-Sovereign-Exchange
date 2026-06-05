import { useGame } from '../../context/GameContext'
import { formatCurrency, formatQty, formatTimeAgo } from '../../lib/utils'

export function Leaderboard() {
  const { state, currentPlayerId } = useGame()

  const ranked = [...state.players].sort((a, b) => b.balance - a.balance)

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header">
        <span>Leaderboard</span>
        <span className="font-mono text-[10px] normal-case tracking-normal">
          By balance
        </span>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {ranked.map((player, i) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 border-b border-[var(--border)] px-3 py-2 ${
              player.id === currentPlayerId ? 'bg-[var(--accent)]/5' : ''
            }`}
          >
            <span
              className={`font-mono text-xs font-bold ${
                i === 0
                  ? 'text-[var(--amber)]'
                  : i === 1
                    ? 'text-[var(--text-muted)]'
                    : i === 2
                      ? 'text-[#cd7f32]'
                      : 'text-[var(--text-muted)]'
              }`}
            >
              #{i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">
                {player.name}
                {player.id === currentPlayerId && (
                  <span className="ml-1 text-[var(--accent)]">(you)</span>
                )}
              </div>
            </div>
            <span className="font-mono text-xs font-semibold">
              {formatCurrency(player.balance)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecentTrades() {
  const { state, now } = useGame()

  const recent = state.contracts.slice(0, 8)

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header">
        <span>Recent Trades</span>
        <span className="font-mono text-[10px] normal-case tracking-normal">
          {recent.length} fills
        </span>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {recent.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--text-muted)]">
            No trades yet — place crossing orders to match
          </div>
        ) : (
          recent.map((c) => {
            const port = state.ports.find((p) => p.id === c.portId)
            const buyer = state.players.find((p) => p.id === c.buyerId)
            const seller = state.players.find((p) => p.id === c.sellerId)

            return (
              <div
                key={c.id}
                className="border-b border-[var(--border)] px-3 py-2"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs font-semibold text-[var(--green)]">
                    ${c.price.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)]">
                    {formatTimeAgo(c.filledAt, now)}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                  {formatQty(c.qty)}t @ {port?.name}
                </div>
                <div className="mt-0.5 truncate text-[9px] text-[var(--text-muted)]">
                  {buyer?.name} ← {seller?.name}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
