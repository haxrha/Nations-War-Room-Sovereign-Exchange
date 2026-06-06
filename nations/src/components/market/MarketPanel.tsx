import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
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

  const tickerItems = commodities.map((commodity) => {
    const spot = spotPrices.find((s) => s.commodityId === commodity.id)
    const history = priceHistory[idStr(commodity.id)] ?? []
    const prev = history.length >= 2 ? history[history.length - 2]!.price : commodity.basePrice
    const price = spot?.price ?? commodity.basePrice
    const { pct, direction } = priceChange(price, prev)
    return { commodity, price, pct, direction }
  })

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
  const doubledTicker = [...tickerItems, ...tickerItems]

  return (
    <Panel title="Market" subtitle="Global commodity spot prices" label="Prices" spotlight className={cn('h-full min-h-0', className)}>
      <div className="overflow-hidden border-b border-white/[0.06] bg-white/[0.02] py-2.5">
        <div className="ticker-track flex w-max gap-10 px-5">
          {doubledTicker.map((item, i) => (
            <div key={`${idStr(item.commodity.id)}-${i}`} className="flex shrink-0 items-center gap-3">
              <span
                className="rounded-md border px-2 py-0.5 font-mono-label text-[10px] uppercase tracking-wider"
                style={{
                  borderColor: `${commodityAccent(item.commodity)}40`,
                  color: commodityAccent(item.commodity),
                }}
              >
                {item.commodity.symbol}
              </span>
              <span className="text-sm font-semibold">{formatPrice(item.price)}</span>
              <span
                className={cn(
                  'flex items-center gap-0.5 text-[10px] font-medium',
                  item.direction === 'up'
                    ? 'text-emerald-400'
                    : item.direction === 'down'
                      ? 'text-red-400'
                      : 'text-[#8A8F98]',
                )}
              >
                {item.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : item.direction === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {Math.abs(item.pct).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] p-3">
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

      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="font-mono-label text-[10px] uppercase tracking-widest text-[#8A8F98]">
          {selected?.name}
        </div>
        <div className="mt-1 flex items-end justify-between gap-4">
          <div className="text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: accent }}>
            {formatPrice(currentPrice)}
          </div>
          {change.direction !== 'flat' && (
            <span
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-medium',
                change.direction === 'up'
                  ? 'border-emerald-500/30 text-emerald-400'
                  : 'border-red-500/30 text-red-400',
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
              tick={{ fill: '#8A8F98', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#8A8F98', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: '#0a0a0c',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 12,
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              }}
              formatter={(v) => [formatPrice(Number(v)), selected?.symbol ?? '']}
            />
            <ReferenceLine
              y={selected?.basePrice ?? 0}
              stroke="rgba(94,106,210,0.4)"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={accent}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
