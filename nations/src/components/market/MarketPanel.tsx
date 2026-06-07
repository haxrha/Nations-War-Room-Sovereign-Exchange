import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../context/GameContext'
import {
  formatPrice,
  getCommodity,
  commodityAccent,
  priceChange,
  idStr,
} from '../../lib/utils'
import {
  buildAlignedMarketSeries,
  buildCommoditySeries,
  chartScrollWidth,
  xTickInterval,
} from '../../lib/marketChartData'
import { Panel } from '../ui/Panel'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

const chartMargin = { top: 12, right: 16, left: 4, bottom: 8 }

const tooltipStyle = {
  background: '#0a0e1a',
  border: '1px solid rgba(26,158,117,0.25)',
  borderRadius: 8,
  fontSize: 11,
  fontFamily: 'ui-monospace',
  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
}

function ScrollableChart({
  data,
  width,
  children,
  minHeight = 200,
}: {
  data: { tick?: number; timestamp?: number }[]
  width: number
  children: React.ReactElement
  minHeight?: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastPoint = data[data.length - 1]
  const scrollKey = lastPoint ? `${lastPoint.tick ?? 0}-${lastPoint.timestamp ?? 0}` : '0'

  useEffect(() => {
    const el = scrollRef.current
    if (!el || data.length < 2) return
    el.scrollLeft = el.scrollWidth - el.clientWidth
  }, [data.length, scrollKey])

  return (
    <div
      ref={scrollRef}
      className="scroll-subtle h-full overflow-x-auto overflow-y-hidden"
    >
      <div style={{ width, height: '100%', minHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

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
  const accent = commodityAccent(selected)

  const primarySeries = useMemo(
    () => buildCommoditySeries(history),
    [history],
  )

  const allSeries = useMemo(
    () => buildAlignedMarketSeries(commodities, priceHistory),
    [commodities, priceHistory],
  )

  const [containerWidth, setContainerWidth] = useState(400)
  const outerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth))
    ro.observe(el)
    setContainerWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const primaryWidth = chartScrollWidth(primarySeries.length, containerWidth)
  const allWidth = chartScrollWidth(allSeries.length, containerWidth)
  const lastPrimary = primarySeries[primarySeries.length - 1]

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
      subtitle={`${primarySeries.length} samples · 1 point/sec · scroll →`}
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

      <div ref={outerRef} className="flex min-h-0 flex-1 flex-col gap-0 p-4">
        {/* Primary: selected commodity — connected tick series */}
        <div className="min-h-[200px] flex-1">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
            {selected?.symbol} · 1 sample per second
          </div>
          <ScrollableChart data={primarySeries} width={primaryWidth} minHeight={200}>
            <ComposedChart data={primarySeries} margin={chartMargin}>
              <defs>
                <linearGradient id="priceAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="rgba(26,158,117,0.08)"
                strokeDasharray="3 6"
                vertical={false}
              />
              <XAxis
                dataKey="tick"
                type="number"
                domain={['dataMin', 'dataMax']}
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'ui-monospace' }}
                axisLine={{ stroke: 'rgba(26,158,117,0.15)' }}
                tickLine={false}
                interval={xTickInterval(primarySeries.length)}
                tickFormatter={(tick) => `#${tick}`}
                label={{
                  value: 'Sample',
                  position: 'insideBottomRight',
                  offset: -4,
                  fill: '#475569',
                  fontSize: 9,
                  fontFamily: 'ui-monospace',
                }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'ui-monospace' }}
                axisLine={{ stroke: 'rgba(26,158,117,0.15)' }}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                width={56}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { timeLabel?: string; tick?: number } | undefined
                  return row ? `#${row.tick} · ${row.timeLabel}` : ''
                }}
                formatter={(v) => [formatPrice(Number(v)), selected?.symbol ?? '']}
              />
              {selected && (
                <ReferenceLine
                  y={selected.basePrice}
                  stroke="rgba(45,212,191,0.35)"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Base',
                    fill: '#64748b',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Area
                type="linear"
                dataKey="price"
                stroke="none"
                fill="url(#priceAreaFill)"
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="price"
                stroke={accent}
                strokeWidth={2}
                dot={{ r: 2.5, fill: accent, stroke: '#0a0e1a', strokeWidth: 1 }}
                activeDot={{ r: 5, fill: accent, stroke: '#f1f5f9', strokeWidth: 1 }}
                isAnimationActive={false}
                connectNulls
              />
            </ComposedChart>
          </ScrollableChart>
          {lastPrimary && (
            <div className="mt-1 text-right font-mono text-[9px] tabular-nums text-[#64748b]">
              Latest #{lastPrimary.tick} · {lastPrimary.timeLabel} · {formatPrice(lastPrimary.price)}
            </div>
          )}
        </div>

        {/* All commodities overlay */}
        <div className="mt-3 min-h-[120px] shrink-0 border-t border-[#1a9e75]/10 pt-3">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
            All commodities
          </div>
          <ScrollableChart data={allSeries} width={allWidth} minHeight={120}>
            <LineChart data={allSeries} margin={{ ...chartMargin, top: 4, bottom: 4 }}>
              <CartesianGrid
                stroke="rgba(26,158,117,0.06)"
                strokeDasharray="3 6"
                vertical={false}
              />
              <XAxis
                dataKey="tick"
                type="number"
                domain={['dataMin', 'dataMax']}
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'ui-monospace' }}
                axisLine={{ stroke: 'rgba(26,158,117,0.12)' }}
                tickLine={false}
                interval={xTickInterval(allSeries.length)}
                tickFormatter={(tick) => `#${tick}`}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'ui-monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                width={44}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { timeLabel?: string; tick?: number } | undefined
                  return row ? `#${row.tick} · ${row.timeLabel}` : ''
                }}
                formatter={(v, name) => [formatPrice(Number(v)), String(name)]}
              />
              {commodities.map((c) => {
                const color = commodityAccent(c)
                const isSelected = selectedCommodityId === c.id
                return (
                  <Line
                    key={idStr(c.id)}
                    type="linear"
                    dataKey={c.symbol}
                    name={c.symbol}
                    stroke={color}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={isSelected ? 1 : 0.5}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                )
              })}
            </LineChart>
          </ScrollableChart>
        </div>
      </div>
    </Panel>
  )
}
