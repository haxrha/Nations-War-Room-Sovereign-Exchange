import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useGame } from '../../context/GameContext'
import { COMMODITY, formatPrice } from '../../lib/utils'

export function PriceChart() {
  const { state, selectedPortId } = useGame()
  const port = state.ports.find((p) => p.id === selectedPortId)
  const history = state.priceHistory[selectedPortId] ?? []
  const spot = state.spotPrices.find((s) => s.portId === selectedPortId)

  const data = history.length > 0
    ? history.map((h, i) => ({
        tick: i + 1,
        price: h.price,
        time: new Date(h.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      }))
    : [{ tick: 0, price: spot?.price ?? port?.basePrice ?? 0, time: 'now' }]

  const basePrice = port?.basePrice ?? 0

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header">
        <span>Price Chart</span>
        <span className="font-mono text-[10px] normal-case tracking-normal">
          Last {data.length} ticks
        </span>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="tick"
              tick={{ fill: '#8b9cb3', fontSize: 10 }}
              axisLine={{ stroke: '#2a3544' }}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#8b9cb3', fontSize: 10 }}
              axisLine={{ stroke: '#2a3544' }}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: '#1a2332',
                border: '1px solid #2a3544',
                borderRadius: 4,
                fontSize: 11,
              }}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.time ?? ''
              }
              formatter={(value) => [formatPrice(Number(value)), COMMODITY]}
            />
            <ReferenceLine
              y={basePrice}
              stroke="#8b9cb3"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b9eff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#3b9eff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
