import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import type { CommodityForecast } from '../../lib/news-types'
import { formatPrice, idStr } from '../../lib/utils'
import { ProbabilityCone } from './ProbabilityCone'
import { NeuralNetworkViz } from './NeuralNetworkViz'
import { cn } from '../../lib/cn'

const COMMODITY_COLORS: Record<string, string> = {
  OIL: '#f59e0b',
  STL: '#94a3b8',
  GRN: '#4ade80',
  ELC: '#60a5fa',
  REE: '#a78bfa',
}

const CONFIDENCE_LABEL = (n: number) =>
  n >= 80 ? 'HIGH' : n >= 60 ? 'MODERATE' : n >= 40 ? 'LOW' : 'SPECULATIVE'

interface PredictionCenterProps {
  forecasts: Record<string, CommodityForecast>
  activeAnchor?: string
  className?: string
}

export function PredictionCenter({ forecasts, activeAnchor = 'ARIA-7', className }: PredictionCenterProps) {
  const { commodities, spotPrices, priceHistory } = useGame()
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    return commodities[0]?.symbol ?? 'OIL'
  })

  const selectedComm = commodities.find((c) => c.symbol === selectedSymbol)
  const selectedSpot = selectedComm
    ? spotPrices.find((s) => s.commodityId === selectedComm.id)
    : undefined

  const selectedHistory = selectedComm
    ? priceHistory[idStr(selectedComm.id)] ?? []
    : []

  const forecast = forecasts[selectedSymbol]
  const color = COMMODITY_COLORS[selectedSymbol] ?? '#2dd4bf'

  return (
    <div className={cn('flex flex-col h-full min-h-0 gap-0', className)}>
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-3.5 w-3.5 text-[#a78bfa]" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#a78bfa]">
            Experimental Prediction Center
          </span>
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[8px] text-amber-400 tracking-wider">
            BETA
          </span>
        </div>

        {/* Commodity selector */}
        <div className="flex gap-1 flex-wrap">
          {commodities.map((c) => (
            <button
              key={idStr(c.id)}
              type="button"
              onClick={() => setSelectedSymbol(c.symbol)}
              className={cn(
                'rounded px-2 py-1 font-mono text-[10px] font-bold transition-all border',
                selectedSymbol === c.symbol
                  ? 'text-[#050506] border-transparent'
                  : 'border-white/[0.06] bg-transparent text-[#64748b] hover:text-[#EDEDEF]',
              )}
              style={
                selectedSymbol === c.symbol
                  ? { background: COMMODITY_COLORS[c.symbol] ?? '#2dd4bf' }
                  : {}
              }
            >
              {c.symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-subtle">
        {/* Current price */}
        <div className="px-4 pt-3 pb-2 flex items-baseline gap-3">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {selectedSpot ? formatPrice(selectedSpot.price) : '—'}
          </span>
          <span className="text-xs text-[#64748b]">{selectedComm?.unit}</span>
        </div>

        {/* Probability cone chart */}
        <div className="px-2 h-36">
          <ProbabilityCone
            priceHistory={selectedHistory}
            accentColor={color}
            className="h-full"
          />
        </div>

        {/* Chart legend */}
        <div className="px-4 pb-2 flex items-center gap-4 text-[9px] text-[#64748b] font-mono">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4" style={{ background: color }} /> Historical
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 border-dashed border-t" style={{ borderColor: color }} /> Central forecast
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm opacity-30" style={{ background: color }} /> 90% CI
          </span>
        </div>

        {/* Neural network viz */}
        <div className="mx-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 mb-3">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="font-mono text-[9px] text-[#64748b] uppercase tracking-wider">
              Model processing
            </span>
            <span className="font-mono text-[9px]" style={{ color }}>
              LIVE
              <span
                className="inline-block ml-1 h-1.5 w-1.5 rounded-full"
                style={{ background: color, animation: 'pulse 1s infinite' }}
              />
            </span>
          </div>
          <NeuralNetworkViz className="h-[100px]" activeAnchor={activeAnchor} />
        </div>

        {/* AI forecast card */}
        {forecast ? (
          <div className="mx-4 mb-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {forecast.outlook === 'bullish' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : forecast.outlook === 'bearish' ? (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                ) : (
                  <Minus className="h-4 w-4 text-[#64748b]" />
                )}
                <span
                  className={cn(
                    'text-sm font-bold uppercase tracking-wide',
                    forecast.outlook === 'bullish'
                      ? 'text-emerald-400'
                      : forecast.outlook === 'bearish'
                      ? 'text-red-400'
                      : 'text-[#64748b]',
                  )}
                >
                  {forecast.outlook}
                </span>
              </div>

              {/* Confidence gauge */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-20 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${forecast.confidence}%`, background: color }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold" style={{ color }}>
                    {forecast.confidence}%
                  </span>
                </div>
                <span className="font-mono text-[8px] text-[#64748b]">
                  {CONFIDENCE_LABEL(forecast.confidence)} confidence
                </span>
              </div>
            </div>

            <p className="text-xs text-[#8A8F98] leading-relaxed">{forecast.rationale}</p>

            {/* Scenario cards */}
            <div className="grid grid-cols-3 gap-1.5">
              <ScenarioCard label="BULL" value={forecast.shortTarget} color="#4ade80" />
              <ScenarioCard label="BASE" value={forecast.longTarget} color={color} />
              <ScenarioCard label="RISK" value={forecast.risk} color="#f87171" small />
            </div>
          </div>
        ) : (
          <div className="mx-4 mb-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-[#64748b] text-center">
            Generate a broadcast to see AI price forecasts
          </div>
        )}
      </div>
    </div>
  )
}

function ScenarioCard({
  label,
  value,
  color,
  small,
}: {
  label: string
  value: string
  color: string
  small?: boolean
}) {
  return (
    <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2 text-center">
      <div className="font-mono text-[8px] text-[#64748b] mb-1">{label}</div>
      <div
        className={cn('font-bold leading-tight', small ? 'text-[9px]' : 'text-xs')}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  )
}
