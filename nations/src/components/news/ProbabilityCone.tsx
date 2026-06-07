import { useMemo } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { PricePoint } from '../../lib/utils'
import { formatPrice } from '../../lib/utils'
import { cn } from '../../lib/cn'

interface ConePoint {
  label: string
  price?: number
  center?: number
  ci50U?: number
  ci50L?: number
  ci90U?: number
  ci90L?: number
}

function buildConeData(history: PricePoint[], steps = 18): ConePoint[] {
  const recent = history.slice(-40)
  if (recent.length < 6) return []

  const prices = recent.map((p) => p.price)
  const n = prices.length

  // Linear trend via least squares
  const meanX = (n - 1) / 2
  const meanY = prices.reduce((a, b) => a + b, 0) / n
  let num = 0; let den = 0
  prices.forEach((p, i) => { num += (i - meanX) * (p - meanY); den += (i - meanX) ** 2 })
  const slope = den > 0 ? num / den : 0

  // Volatility from returns
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  const meanR = returns.reduce((a, b) => a + b, 0) / (returns.length || 1)
  const variance = returns.reduce((s, r) => s + (r - meanR) ** 2, 0) / (returns.length || 1)
  const vol = Math.sqrt(variance)

  const last = prices[n - 1]

  const historical: ConePoint[] = recent.slice(-20).map((p, i) => ({
    label: `H${i - 19}`,
    price: p.price,
  }))

  const projected: ConePoint[] = Array.from({ length: steps }, (_, i) => {
    const t = i + 1
    const center = last + slope * t
    const sigma = vol * last * Math.sqrt(t)
    return {
      label: `+${t}`,
      center,
      ci50U: center + 0.675 * sigma,
      ci50L: Math.max(0, center - 0.675 * sigma),
      ci90U: center + 1.645 * sigma,
      ci90L: Math.max(0, center - 1.645 * sigma),
    }
  })

  return [...historical, ...projected]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value?: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  const main = payload.find((p) => p.name === 'price' || p.name === 'center')
  if (!main?.value) return null
  return (
    <div className="rounded-lg border border-white/10 bg-[#0a0e1a]/95 px-3 py-2 text-xs shadow-xl">
      <div className="font-mono text-[#8A8F98]">{label}</div>
      <div className="font-bold text-[#EDEDEF]">{formatPrice(main.value)}</div>
    </div>
  )
}

export function ProbabilityCone({
  priceHistory,
  accentColor = '#2dd4bf',
  className,
}: {
  priceHistory: PricePoint[]
  accentColor?: string
  className?: string
}) {
  const data = useMemo(() => buildConeData(priceHistory), [priceHistory])

  const splitIdx = data.findIndex((d) => d.center !== undefined)
  const lastHistorical = splitIdx > 0 ? data[splitIdx - 1] : undefined
  const lastPrice = lastHistorical?.price

  if (data.length < 4) {
    return (
      <div className={cn('flex items-center justify-center text-xs text-[#64748b]', className)}>
        Waiting for price history…
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="ci90" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accentColor} stopOpacity={0.08} />
            <stop offset="95%" stopColor={accentColor} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="ci50" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accentColor} stopOpacity={0.18} />
            <stop offset="95%" stopColor={accentColor} stopOpacity={0.06} />
          </linearGradient>
        </defs>

        <XAxis dataKey="label" hide />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `$${Math.round(v)}`}
          tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
          width={48}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />

        {lastPrice && (
          <ReferenceLine
            x={lastHistorical?.label}
            stroke={accentColor}
            strokeDasharray="2 2"
            strokeOpacity={0.3}
          />
        )}

        {/* 90% CI band */}
        <Area
          dataKey="ci90U"
          stroke="none"
          fill="url(#ci90)"
          fillOpacity={1}
          isAnimationActive={false}
          legendType="none"
          name="ci90u"
        />
        <Area
          dataKey="ci90L"
          stroke="none"
          fill="#0a0e1a"
          fillOpacity={1}
          isAnimationActive={false}
          legendType="none"
          name="ci90l"
        />

        {/* 50% CI band */}
        <Area
          dataKey="ci50U"
          stroke="none"
          fill="url(#ci50)"
          fillOpacity={1}
          isAnimationActive={false}
          legendType="none"
          name="ci50u"
        />
        <Area
          dataKey="ci50L"
          stroke="none"
          fill="#0a0e1a"
          fillOpacity={1}
          isAnimationActive={false}
          legendType="none"
          name="ci50l"
        />

        {/* Historical price */}
        <Line
          dataKey="price"
          stroke={accentColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          name="price"
          connectNulls={false}
        />

        {/* Central forecast */}
        <Line
          dataKey="center"
          stroke={accentColor}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          isAnimationActive={false}
          name="center"
          opacity={0.6}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
