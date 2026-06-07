import { useCallback, useEffect, useRef, useState } from 'react'
import { GripHorizontal, Loader2, Sparkles, X } from 'lucide-react'
import type { TradeExplanation } from '../../lib/trade-explain-types'
import { cn } from '../../lib/cn'

const STORAGE_KEY = 'nations_trade_explain_pos'

function loadPosition(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as { x: number; y: number }
  } catch {
    /* ignore */
  }
  return { x: 24, y: 120 }
}

function savePosition(pos: { x: number; y: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
}

const QUALITY_STYLES: Record<
  TradeExplanation['qualityLabel'],
  { border: string; badge: string; text: string }
> = {
  strong: {
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-300',
  },
  fair: {
    border: 'border-[#2dd4bf]/30',
    badge: 'bg-[#2dd4bf]/10 text-[#2dd4bf] border-[#2dd4bf]/30',
    text: 'text-[#2dd4bf]',
  },
  risky: {
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    text: 'text-amber-300',
  },
  poor: {
    border: 'border-red-500/30',
    badge: 'bg-red-500/10 text-red-300 border-red-500/30',
    text: 'text-red-300',
  },
}

export function TradeExplainPopup({
  open,
  loading,
  error,
  explanation,
  commoditySymbol,
  onClose,
}: {
  open: boolean
  loading: boolean
  error: string | null
  explanation: TradeExplanation | null
  commoditySymbol?: string
  onClose: () => void
}) {
  const [pos, setPos] = useState(loadPosition)
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button[data-close]')) return
      dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pos.x, pos.y],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const next = {
      x: Math.max(8, Math.min(window.innerWidth - 320, dragRef.current.originX + dx)),
      y: Math.max(8, Math.min(window.innerHeight - 120, dragRef.current.originY + dy)),
    }
    setPos(next)
  }, [])

  const onPointerUp = useCallback(() => {
    if (dragRef.current) {
      savePosition(pos)
      dragRef.current = null
    }
  }, [pos])

  if (!open) return null

  const styles = explanation ? QUALITY_STYLES[explanation.qualityLabel] : QUALITY_STYLES.fair

  return (
    <div
      className={cn(
        'fixed z-[700] w-[min(calc(100vw-2rem),22rem)] rounded-xl border bg-[#0a0e1a]/95 shadow-2xl backdrop-blur-xl',
        styles.border,
      )}
      style={{ left: pos.x, top: pos.y }}
      role="dialog"
      aria-labelledby="trade-explain-title"
      aria-live="polite"
    >
      <div
        className="flex cursor-grab items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex min-w-0 items-center gap-2">
          <GripHorizontal className="h-4 w-4 shrink-0 text-[#64748b]" />
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#2dd4bf]" />
          <div className="min-w-0">
            <div id="trade-explain-title" className="truncate text-xs font-semibold text-[#f1f5f9]">
              Explain my trade
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
              {commoditySymbol ? `${commoditySymbol} · Gemini tutor` : 'Powered by Gemini'}
            </div>
          </div>
        </div>
        <button
          type="button"
          data-close
          onClick={onClose}
          className="rounded-lg p-1 text-[#64748b] transition-colors hover:bg-white/[0.06] hover:text-[#f1f5f9]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[min(60vh,24rem)] overflow-y-auto scroll-subtle p-4 text-xs leading-relaxed text-[#cbd5e1]">
        {loading && (
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <Loader2 className="h-4 w-4 animate-spin text-[#2dd4bf]" />
            Analyzing trade against live market data…
          </div>
        )}
        {error && !loading && <p className="text-red-400">{error}</p>}
        {explanation && !loading && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
                  styles.badge,
                )}
              >
                {explanation.qualityLabel} · {explanation.qualityScore}/100
              </span>
            </div>
            <p className={cn('text-sm font-semibold', styles.text)}>{explanation.headline}</p>
            <p className="mt-2 whitespace-pre-wrap">{explanation.analysis}</p>
            {explanation.historicalComparison && (
              <p className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-[11px] text-[#94a3b8]">
                {explanation.historicalComparison}
              </p>
            )}
            {explanation.assumptions.length > 0 && (
              <div className="mt-3">
                <div className="font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
                  Assumptions
                </div>
                <ul className="mt-1 space-y-1 text-[11px] text-[#94a3b8]">
                  {explanation.assumptions.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
              </div>
            )}
            {explanation.risks.length > 0 && (
              <div className="mt-3">
                <div className="font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
                  Risks
                </div>
                <ul className="mt-1 space-y-1 text-[11px] text-amber-400/90">
                  {explanation.risks.map((r) => (
                    <li key={r}>⚠ {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
