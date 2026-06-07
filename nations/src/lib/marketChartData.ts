import type { Commodity } from '../context/GameContext'
import type { PricePoint } from './utils'
import { idStr } from './utils'

/** Horizontal pixels per tick on the scrollable chart */
export const CHART_PX_PER_POINT = 28

export function formatChartTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export type SeriesPoint = {
  tick: number
  timestamp: number
  timeLabel: string
  price: number
}

export type AlignedTickRow = {
  tick: number
  timestamp: number
  timeLabel: string
  [symbol: string]: number | string
}

/** Single-commodity time series — one connected point per server tick. */
export function buildCommoditySeries(history: readonly PricePoint[]): SeriesPoint[] {
  return history.map((p, i) => ({
    tick: i + 1,
    timestamp: p.timestamp,
    timeLabel: formatChartTime(p.timestamp),
    price: p.price,
  }))
}

/** Align all commodities on shared tick indices (same server price_tick). */
export function buildAlignedMarketSeries(
  commodities: readonly Commodity[],
  priceHistory: Record<string, PricePoint[]>,
): AlignedTickRow[] {
  const tickMeta = new Map<string, number>()

  for (const c of commodities) {
    for (const p of priceHistory[idStr(c.id)] ?? []) {
      const key = p.serverTick ?? `t-${p.timestamp}`
      if (!tickMeta.has(key)) tickMeta.set(key, p.timestamp)
    }
  }

  if (tickMeta.size === 0) return []

  const orderedTicks = [...tickMeta.entries()].sort(
    (a, b) => a[1] - b[1] || a[0].localeCompare(b[0]),
  )

  return orderedTicks.map(([tickKey, ts], index) => {
    const row: AlignedTickRow = {
      tick: index + 1,
      timestamp: ts,
      timeLabel: formatChartTime(ts),
    }
    for (const c of commodities) {
      const hist = priceHistory[idStr(c.id)] ?? []
      const pt = hist.find((p) => (p.serverTick ?? `t-${p.timestamp}`) === tickKey)
      if (pt) row[c.symbol] = pt.price
    }
    return row
  })
}

export function chartScrollWidth(pointCount: number, containerWidth: number): number {
  return Math.max(containerWidth, pointCount * CHART_PX_PER_POINT)
}

export function xTickInterval(pointCount: number): number {
  if (pointCount <= 8) return 0
  return Math.max(1, Math.floor(pointCount / 10))
}
