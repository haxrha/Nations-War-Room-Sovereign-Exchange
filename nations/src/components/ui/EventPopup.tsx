import { useEffect, useRef, useState } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { useGame, type WorldEvent } from '../../context/GameContext'
import { getCommodity } from '../../lib/utils'
import { cn } from '../../lib/cn'

function PriceDirection({ multiplier }: { multiplier: number }) {
  const pct = Math.round(Math.abs(multiplier - 1) * 100)
  const up = multiplier >= 1
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold',
        up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400',
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : '-'}{pct}%
    </span>
  )
}

export function EventPopup() {
  const { worldEvents, commodities } = useGame()
  const [visible, setVisible] = useState(false)
  const [event, setEvent] = useState<WorldEvent | null>(null)
  const lastShownId = useRef<bigint | null>(null)

  useEffect(() => {
    const fresh = worldEvents.filter((e) => e.active)
    if (fresh.length === 0) return

    // Sort by triggeredAt descending to get the latest
    const latest = [...fresh].sort((a, b) =>
      Number(b.triggeredAt.microsSinceUnixEpoch - a.triggeredAt.microsSinceUnixEpoch),
    )[0]

    if (latest.id !== lastShownId.current) {
      lastShownId.current = latest.id
      setEvent(latest)
      setVisible(true)
    }
  }, [worldEvents])

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 12_000)
    return () => clearTimeout(t)
  }, [visible])

  if (!visible || !event) return null

  const commodity =
    event.affectedCommodityId !== 0n
      ? getCommodity(event.affectedCommodityId, commodities)
      : null

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[9999] w-[360px] max-w-[calc(100vw-3rem)]',
        'animate-in slide-in-from-bottom-4 fade-in duration-500',
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Pulsing border glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/20 blur-md" />

      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-[#0a0e1a]/95 shadow-2xl backdrop-blur-xl">
        {/* Warning stripe */}
        <div className="flex items-center gap-2 bg-amber-500/15 px-4 py-2.5 border-b border-amber-500/20">
          <span className="text-base">⚠️</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold">
            Global Crisis Alert
          </span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="ml-auto text-[#64748b] hover:text-[#EDEDEF] transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-base font-bold text-[#EDEDEF] leading-tight">
            {event.headline}
          </div>

          <p className="text-xs text-[#8A8F98] leading-relaxed">
            {event.description}
          </p>

          {/* Market impact */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 space-y-2">
            <div className="font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
              Market Impact
            </div>
            {commodity ? (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#EDEDEF]">
                  {commodity.symbol} — {commodity.name}
                </span>
                <PriceDirection multiplier={event.priceMultiplier} />
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8A8F98]">All commodities</span>
                <PriceDirection multiplier={event.priceMultiplier} />
              </div>
            )}
            <p className="text-[10px] text-[#64748b]">
              Spot prices updated — check the Market tab for live changes.
            </p>
          </div>

          {/* Auto-dismiss bar */}
          <div className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-amber-500/50 rounded-full"
              style={{
                animation: 'shrink 12s linear forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
