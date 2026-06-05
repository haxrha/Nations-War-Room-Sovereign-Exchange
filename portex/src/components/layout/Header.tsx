import { useGame } from '../../context/GameContext'
import { formatCurrency } from '../../lib/utils'

export function Header() {
  const { state, currentPlayerId, setCurrentPlayer, now } = useGame()
  const player = state.players.find((p) => p.id === currentPlayerId)

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-panel)] px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--accent)] text-xs font-bold text-white">
            P
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Portex</h1>
            <p className="text-[10px] text-[var(--text-muted)]">
              Global Freight Exchange
            </p>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
          <span className="text-[10px] font-medium text-[var(--green)]">
            LIVE
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            tick #{state.tickCount}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Playing as
          </span>
          <select
            value={currentPlayerId}
            onChange={(e) => setCurrentPlayer(e.target.value)}
            className="rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
          >
            {state.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-right">
          <div className="font-mono text-sm font-semibold text-[var(--accent)]">
            {formatCurrency(player?.balance ?? 0)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            {new Date(now).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </header>
  )
}
