import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { COMMODITIES } from '../../data/mockData'
import { formatPrice, getCommodity, getCountry, priceChange } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { Button } from '../ui/Button'
import { accentAt } from '../../lib/design-system'
import { cn } from '../../lib/cn'

export function MarketPanel() {
  const { state, setSelectedCommodity } = useGame()
  const { selectedCommodityId, playerCountryId } = state

  const globalSpots = COMMODITIES.map((commodity) => {
    const spots = state.spotPrices.filter((s) => s.commodityId === commodity.id)
    const avg = spots.reduce((s, p) => s + p.price, 0) / (spots.length || 1)
    const prevAvg = spots.reduce((s, p) => s + p.prevPrice, 0) / (spots.length || 1)
    const delta = avg - prevAvg
    return { commodity, avg, delta, pct: prevAvg ? (delta / prevAvg) * 100 : 0 }
  })

  const playerSpot = state.spotPrices.find((s) => s.countryId === playerCountryId && s.commodityId === selectedCommodityId)
  const commodity = getCommodity(selectedCommodityId)
  const country = getCountry(playerCountryId, state.countries)
  const history = state.priceHistory[`${playerCountryId}-${selectedCommodityId}`] ?? []
  const change = playerSpot ? priceChange(playerSpot) : null
  const chartData = history.length > 0 ? history.map((h, i) => ({ tick: i + 1, price: h.price })) : [{ tick: 0, price: playerSpot?.price ?? commodity?.basePrice ?? 0 }]
  const tickerItems = [...globalSpots, ...globalSpots]

  return (
    <Panel title="Market" subtitle="Global commodity prices" accentIndex={1} emoji="📈">
      <div className="overflow-hidden border-b-4 border-dashed py-2" style={{ borderColor: accentAt(2), backgroundColor: `${accentAt(1)}12` }}>
        <div className="ticker-track flex w-max gap-8 px-4">
          {tickerItems.map((item, i) => (
            <div key={`${item.commodity.id}-${i}`} className="flex shrink-0 items-center gap-3">
              <span className="rounded-full border-2 px-2 py-0.5 font-heading text-[10px] font-black" style={{ borderColor: accentAt(i % 5), color: accentAt(i % 5) }}>{item.commodity.symbol}</span>
              <span className="font-heading text-sm font-black">{formatPrice(item.avg)}</span>
              <span className={cn('flex items-center gap-0.5 font-heading text-[10px] font-bold', item.delta >= 0 ? 'text-[#34d399]' : 'text-[#f87171]')}>
                {item.delta >= 0 ? <TrendingUp className="h-3 w-3" strokeWidth={3} /> : <TrendingDown className="h-3 w-3" strokeWidth={3} />}
                {Math.abs(item.pct).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b-4 border-dotted p-3" style={{ borderColor: accentAt(3) }}>
        {COMMODITIES.map((c, i) => (
          <Button key={c.id} variant={selectedCommodityId === c.id ? 'primary' : 'secondary'} accentIndex={i} size="sm" onClick={() => setSelectedCommodity(c.id)}>{c.symbol}</Button>
        ))}
      </div>
      <div className="border-b-4 px-4 py-3" style={{ borderColor: accentAt(4) }}>
        <div className="font-heading text-[10px] font-bold uppercase tracking-widest text-[#00F5D4]">{country?.flag} {country?.name} · {commodity?.name}</div>
        <div className="flex items-end justify-between">
          <div className="font-heading text-3xl font-black text-shadow-triple md:text-4xl" style={{ color: commodity?.color ?? accentAt(0) }}>
            {formatPrice(playerSpot?.price ?? commodity?.basePrice ?? 0)}
          </div>
          {change && (
            <span className={cn('rounded-full border-4 px-3 py-1 font-heading text-sm font-black', change.direction === 'up' ? 'border-[#34d399] text-[#34d399]' : 'border-[#f87171] text-[#f87171]')}>
              {change.direction === 'up' ? '▲' : '▼'} {Math.abs(change.pct).toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      <div className="min-h-[140px] flex-1 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="tick" tick={{ fill: '#ffffff88', fontSize: 9 }} axisLine={{ stroke: '#FF3AF2', strokeWidth: 2 }} tickLine={false} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#ffffff88', fontSize: 9 }} axisLine={{ stroke: '#00F5D4', strokeWidth: 2 }} tickLine={false} tickFormatter={(v) => `$${v}`} width={48} />
            <Tooltip contentStyle={{ background: '#2D1B4E', border: '4px solid #FF3AF2', borderRadius: 16, fontWeight: 700, boxShadow: '8px 8px 0 #FFE600' }} formatter={(v) => [formatPrice(Number(v)), commodity?.symbol ?? '']} />
            <ReferenceLine y={commodity?.basePrice ?? 0} stroke="#FFE600" strokeDasharray="6 6" strokeWidth={2} />
            <Line type="monotone" dataKey="price" stroke={commodity?.color ?? '#FF3AF2'} strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
