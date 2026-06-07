import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../context/GameContext'
import {
  formatPrice,
  getCommodity,
  commodityAccent,
  priceChange,
  idStr,
} from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

export function MarketPanel({ className }: { className?: string }) {
  const {
    commodities,
    spotPrices,
    selectedCommodityId,
    setSelectedCommodity,
    priceHistory,
  } = useGame()

  const selected = selectedCommodityId
    ? getCommodity(selectedCommodityId, commodities)
    : commodities[0]
  const selectedSpot = selected
    ? spotPrices.find((s) => s.commodityId === selected.id)
    : undefined
  const history = selected ? (priceHistory[idStr(selected.id)] ?? []) : []
  const prevPrice =
    history.length >= 2 ? history[history.length - 2]!.price : selected?.basePrice ?? 0
  const currentPrice = selectedSpot?.price ?? selected?.basePrice ?? 0
  const change = priceChange(currentPrice, prevPrice)
  const chartData =
    history.length > 0
      ? history.map((h, i) => ({ tick: i + 1, price: h.price }))
      : [{ tick: 0, price: currentPrice }]
  const accent = commodityAccent(selected)

  const [priceFlash, setPriceFlash] = useState(false)
  const prevPriceRef = useRef(currentPrice)
  useEffect(() => {
    if (prevPriceRef.current !== currentPrice) {
      setPriceFlash(true)
      const t = window.setTimeout(() => setPriceFlash(false), 650)
      prevPriceRef.current = currentPrice
      return () => window.clearTimeout(t)
    }
  }, [currentPrice])

  return (
    <Panel
      title="Market Terminal"
      subtitle="Live commodity spot feed"
      label="Prices"
      spotlight
      className={cn('h-full min-h-0', className)}
    >
      <div className="flex flex-wrap gap-2 border-b border-[#1a9e75]/10 p-3">
        {commodities.map((c) => (
          <Button
            key={idStr(c.id)}
            variant={selectedCommodityId === c.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCommodity(c.id)}
          >
            {c.symbol}
          </Button>
        ))}
      </div>

      <div className="border-b border-[#1a9e75]/10 px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#64748b]">
          {selected?.name}
        </div>
        <div className="mt-1 flex items-end justify-between gap-4">
          <div
            className={cn(
              'font-mono text-3xl font-semibold tabular-nums tracking-tight md:text-4xl',
              priceFlash && 'price-flash',
            )}
            style={{ color: accent }}
          >
            {formatPrice(currentPrice)}
          </div>
          {change.direction !== 'flat' && (
            <span
              className={cn(
                'rounded border px-2.5 py-1 font-mono text-xs font-medium tabular-nums',
                change.direction === 'up'
                  ? 'border-[#2dd4bf]/30 text-[#2dd4bf]'
                  : 'border-[#f87171]/30 text-[#f87171]',
              )}
            >
              {change.direction === 'up' ? '▲' : '▼'} {Math.abs(change.pct).toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      <div className="min-h-[160px] flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="tick"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'ui-monospace' }}
              axisLine={{ stroke: 'rgba(26,158,117,0.12)' }}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'ui-monospace' }}
              axisLine={{ stroke: 'rgba(26,158,117,0.12)' }}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: '#0a0e1a',
                border: '1px solid rgba(26,158,117,0.2)',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'ui-monospace',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              }}
              formatter={(v) => [formatPrice(Number(v)), selected?.symbol ?? '']}
            />
            <ReferenceLine
              y={selected?.basePrice ?? 0}
              stroke="rgba(45,212,191,0.35)"
              strokeDasharray="4 4"
            />
            <Line type="monotone" dataKey="price" stroke={accent} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
