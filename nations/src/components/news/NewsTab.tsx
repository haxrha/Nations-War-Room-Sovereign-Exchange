import { useState, useCallback, useEffect, useRef } from 'react'
import { RefreshCw, Radio } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import type { NewsItem, MarketMood, CommodityForecast, NewsAnchor } from '../../lib/news-types'
import { generateNews } from '../../lib/news-api'
import { buildNewsContext } from '../../lib/buildNewsContext'
import { NewsFeed } from './NewsFeed'
import { PredictionCenter } from './PredictionCenter'
import { cn } from '../../lib/cn'

const AUTO_REFRESH_MS = 120_000 // 2 minutes

export function NewsTab() {
  const game = useGame()

  const [items, setItems] = useState<NewsItem[]>([])
  const [marketMood, setMarketMood] = useState<MarketMood | null>(null)
  const [moodReason, setMoodReason] = useState('')
  const [forecasts, setForecasts] = useState<Record<string, CommodityForecast>>({})
  const [activeAnchor, setActiveAnchor] = useState<NewsAnchor>('ARIA-7')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchNews = useCallback(async () => {
    if (!game.tablesReady || loading) return
    setLoading(true)
    setError(null)
    try {
      const ctx = buildNewsContext(game)
      const res = await generateNews(ctx)
      if (res.ok) {
        setItems(res.items)
        setMarketMood(res.marketMood)
        setMoodReason(res.moodReason)
        setForecasts(res.forecasts)
        setLastUpdated(Date.now())
        setSecondsAgo(0)
        if (res.items.length > 0) setActiveAnchor(res.items[0].anchor as NewsAnchor)
      } else {
        setError(res.error.message)
      }
    } catch {
      setError('Failed to fetch broadcast. Check your Gemini API key.')
    } finally {
      setLoading(false)
    }
  }, [game, loading])

  // Auto-refresh
  useEffect(() => {
    if (!game.tablesReady) return
    fetchNews()
    timerRef.current = setTimeout(function tick() {
      fetchNews()
      timerRef.current = setTimeout(tick, AUTO_REFRESH_MS)
    }, AUTO_REFRESH_MS)
    return () => clearTimeout(timerRef.current)
  }, [game.tablesReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live "X seconds ago" counter
  useEffect(() => {
    if (!lastUpdated) return
    const t = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [lastUpdated])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#050508] shadow-2xl">
      {/* Station header */}
      <header className="shrink-0 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#050508] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-400" />
            <span className="font-mono font-bold text-sm tracking-widest text-[#EDEDEF]">
              NNN
            </span>
            <span className="text-[10px] text-[#64748b] tracking-wider hidden sm:inline">
              NATIONS NEWS NETWORK
            </span>
          </div>
          {/* LIVE badge */}
          <div className="flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-red-500"
              style={{ animation: 'pulse 1.5s infinite' }}
            />
            <span className="font-mono text-[9px] font-bold text-red-400 tracking-wider">LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && !loading && (
            <span className="font-mono text-[9px] text-[#64748b]">
              updated {secondsAgo}s ago
            </span>
          )}
          <button
            type="button"
            onClick={fetchNews}
            disabled={loading || !game.connected}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-[#8A8F98] transition-all hover:border-white/10 hover:text-[#EDEDEF] disabled:opacity-40',
            )}
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            {loading ? 'Broadcasting…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Scrolling ticker */}
      {items.length > 0 && (
        <div className="shrink-0 overflow-hidden border-b border-white/[0.04] bg-[#080a12] py-1.5">
          <div
            className="flex gap-8 whitespace-nowrap font-mono text-[10px]"
            style={{ animation: 'ticker 30s linear infinite' }}
          >
            {[...items, ...items].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-[#64748b]">◈</span>
                <span className="text-amber-400 font-bold">{item.ticker}</span>
                <span className="text-[#8A8F98]">{item.headline}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="min-h-0 flex-1 grid grid-cols-1 md:grid-cols-[1fr_340px] divide-y md:divide-y-0 md:divide-x divide-white/[0.04]">
        {/* News feed */}
        <NewsFeed
          items={items}
          marketMood={marketMood}
          moodReason={moodReason}
          loading={loading}
          error={error}
        />

        {/* Prediction center */}
        <PredictionCenter forecasts={forecasts} activeAnchor={activeAnchor} />
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
