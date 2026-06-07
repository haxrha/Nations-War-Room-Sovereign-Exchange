import { useCallback, useState } from 'react'
import { TradeOffers, RecentTrades } from './TradeOffers'
import { TradeExplainPopup } from './TradeExplainPopup'
import { explainTrade } from '../../lib/trade-explain-api'
import type { ExplainTradeRequest, TradeExplanation } from '../../lib/trade-explain-types'
import { cn } from '../../lib/cn'

type ExchangeView = 'offers' | 'history'

export function ExchangeTab() {
  const [view, setView] = useState<ExchangeView>('offers')
  const [explainOpen, setExplainOpen] = useState(false)
  const [explainLoading, setExplainLoading] = useState(false)
  const [explainError, setExplainError] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<TradeExplanation | null>(null)
  const [explainSymbol, setExplainSymbol] = useState<string | undefined>()

  const handleTradeAccepted = useCallback(async (payload: ExplainTradeRequest) => {
    setExplainOpen(true)
    setExplainLoading(true)
    setExplainError(null)
    setExplanation(null)
    setExplainSymbol(payload.trade.commoditySymbol)

    try {
      const result = await explainTrade(payload)
      if (!result.ok) {
        setExplainError(result.error.message)
        return
      }
      setExplanation(result.explanation)
    } catch (e) {
      setExplainError(e instanceof Error ? e.message : 'Failed to explain trade')
    } finally {
      setExplainLoading(false)
    }
  }, [])

  const closeExplain = useCallback(() => {
    setExplainOpen(false)
    setExplainLoading(false)
    setExplainError(null)
    setExplanation(null)
  }, [])

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3">
      <div
        className="flex shrink-0 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1"
        role="tablist"
        aria-label="Exchange views"
      >
        {(
          [
            { id: 'offers' as const, label: 'Open offers' },
            { id: 'history' as const, label: 'Trade history' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all duration-200 md:text-sm',
              view === id
                ? 'bg-[#5E6AD2] text-white shadow-[0_2px_8px_rgba(94,106,210,0.35)]'
                : 'text-[#8A8F98] hover:text-[#EDEDEF]',
            )}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {view === 'offers' ? (
          <TradeOffers className="h-full" onTradeAccepted={handleTradeAccepted} />
        ) : (
          <RecentTrades className="h-full" limit={50} />
        )}
      </div>

      <TradeExplainPopup
        open={explainOpen}
        loading={explainLoading}
        error={explainError}
        explanation={explanation}
        commoditySymbol={explainSymbol}
        onClose={closeExplain}
      />
    </div>
  )
}
