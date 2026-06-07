import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../context/GameContext'
import {
  formatPrice,
  commodityAccent,
  priceChange,
  idStr,
} from '../../lib/utils'
import { cn } from '../../lib/cn'

function MiniSparkline({
  data,
  color,
  direction,
}: {
  data: { price: number }[]
  color: string
  direction: 'up' | 'down' | 'flat'
}) {
  if (data.length < 2) {
    return <div className="h-8 w-20 rounded bg-white/[0.03]" />
  }

  return (
    <div className="h-8 w-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey="price"
            stroke={direction === 'down' ? '#f87171' : direction === 'up' ? '#2dd4bf' : color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PriceTickerBar() {
  const { commodities, spotPrices, priceHistory, tablesReady } = useGame()
  const prevPricesRef = useRef<Map<string, number>>(new Map())
  const [flashing, setFlashing] = useState<Set<string>>(new Set())

  const items = useMemo(() => {
    return commodities.map((commodity) => {
      const spot = spotPrices.find((s) => s.commodityId === commodity.id)
      const key = idStr(commodity.id)
      const history = priceHistory[key] ?? []
      const chartData =
        history.length > 0
          ? history.map((h) => ({ price: h.price }))
          : [{ price: spot?.price ?? commodity.basePrice }]
      const prev =
        history.length >= 2 ? history[history.length - 2]!.price : commodity.basePrice
      const price = spot?.price ?? commodity.basePrice
      const { pct, direction } = priceChange(price, prev)
      return { commodity, price, pct, direction, key, chartData }
    })
  }, [commodities, spotPrices, priceHistory])

  useEffect(() => {
    const nextFlash = new Set<string>()
    for (const item of items) {
      const prev = prevPricesRef.current.get(item.key)
      if (prev != null && prev !== item.price) nextFlash.add(item.key)
      prevPricesRef.current.set(item.key, item.price)
    }
    if (!nextFlash.size) return
    setFlashing(nextFlash)
    const t = window.setTimeout(() => setFlashing(new Set()), 650)
    return () => window.clearTimeout(t)
  }, [items])

  if (!tablesReady || !items.length) return null

  return (
    <div className="terminal-ticker relative z-50 shrink-0 border-b border-[#1a9e75]/20 bg-[#060b14]/95">
      <div className="overflow-x-auto scroll-subtle">
        <div className="flex min-w-full items-stretch gap-0 divide-x divide-[#1a9e75]/10">
          {items.map((item) => {
            const isFlash = flashing.has(item.key)
            const accent = commodityAccent(item.commodity)
            return (
              <div
                key={item.key}
                className={cn(
                  'flex min-w-[11rem] flex-1 flex-col gap-1 px-3 py-2 transition-colors',
                  isFlash && 'price-flash',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: accent }}
                  >
                    {item.commodity.symbol}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[10px] tabular-nums',
                      item.direction === 'up'
                        ? 'text-[#2dd4bf]'
                        : item.direction === 'down'
                          ? 'text-[#f87171]'
                          : 'text-[#64748b]',
                    )}
                  >
                    {item.direction === 'up' ? '▲' : item.direction === 'down' ? '▼' : '—'}{' '}
                    {Math.abs(item.pct).toFixed(2)}%
                  </span>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums text-[#e2e8f0]">
                  {formatPrice(item.price)}
                </span>
                <MiniSparkline
                  data={item.chartData}
                  color={accent}
                  direction={item.direction}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
