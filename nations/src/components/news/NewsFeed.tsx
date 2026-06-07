import { cn } from '../../lib/cn'
import type { NewsItem, NewsAnchor, MarketMood } from '../../lib/news-types'

const ANCHOR_META: Record<NewsAnchor, { color: string; bg: string; title: string }> = {
  'ARIA-7': { color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)', title: 'Chief Market Analyst' },
  NOVA: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: 'Geopolitical Correspondent' },
  'HELIX-3': { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', title: 'Commodities Desk' },
  CIPHER: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', title: 'Cyber Intelligence' },
}

const CATEGORY_COLORS: Record<string, string> = {
  BREAKING: 'bg-red-500/20 text-red-300 border-red-500/30',
  MARKET: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  GEOPOLITICAL: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  ANALYSIS: 'bg-[#5E6AD2]/20 text-[#a5b4fc] border-[#5E6AD2]/30',
  PREDICTION: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
}

const MOOD_COLORS: Record<MarketMood, string> = {
  'RISK-ON': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'RISK-OFF': 'text-red-400 bg-red-500/10 border-red-500/20',
  NEUTRAL: 'text-[#8A8F98] bg-white/[0.04] border-white/[0.08]',
  VOLATILE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

function AnchorAvatar({ anchor }: { anchor: NewsAnchor }) {
  const meta = ANCHOR_META[anchor]
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div
        className="relative h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0"
        style={{ background: meta.bg, border: `1px solid ${meta.color}40`, color: meta.color }}
      >
        {anchor.split('-')[0][0]}
        {/* Pulsing dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#050506]"
          style={{ background: meta.color, animation: 'pulse 2s infinite' }}
        />
      </div>
      <div>
        <div className="text-[10px] font-mono font-bold" style={{ color: meta.color }}>
          {anchor}
        </div>
        <div className="text-[9px] text-[#64748b]">{meta.title}</div>
      </div>
    </div>
  )
}

function WaveformBar({ color, delay }: { color: string; delay: number }) {
  return (
    <span
      className="inline-block w-0.5 rounded-full"
      style={{
        background: color,
        height: '12px',
        animation: `waveform 0.8s ${delay}s ease-in-out infinite alternate`,
      }}
    />
  )
}

interface NewsFeedProps {
  items: NewsItem[]
  marketMood: MarketMood | null
  moodReason: string
  loading: boolean
  error: string | null
  className?: string
}

export function NewsFeed({ items, marketMood, moodReason, loading, error, className }: NewsFeedProps) {
  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {/* Mood banner */}
      {marketMood && (
        <div
          className={cn(
            'shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/[0.06] text-xs',
            MOOD_COLORS[marketMood],
          )}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[10px] tracking-wider">{marketMood}</span>
            <span className="text-[10px] opacity-75">{moodReason}</span>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto">
        {loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 h-40 text-[#64748b]">
            <div className="flex gap-1 items-end">
              {[0, 0.15, 0.3, 0.15, 0].map((d, i) => (
                <WaveformBar key={i} color="#2dd4bf" delay={d} />
              ))}
            </div>
            <span className="text-xs font-mono">Generating broadcast…</span>
          </div>
        )}

        {error && (
          <div className="m-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {items.map((item, i) => {
          const meta = ANCHOR_META[item.anchor] ?? ANCHOR_META['ARIA-7']
          const catClass = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.MARKET
          return (
            <article
              key={item.id ?? i}
              className={cn(
                'border-b border-white/[0.04] p-4 transition-colors hover:bg-white/[0.015]',
                i === 0 && 'bg-white/[0.02]',
              )}
            >
              <div className="flex items-start gap-3">
                <AnchorAvatar anchor={item.anchor} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider',
                        catClass,
                      )}
                    >
                      {item.category}
                    </span>
                    <span
                      className="font-mono text-[10px] font-bold"
                      style={{ color: meta.color }}
                    >
                      {item.ticker}
                    </span>
                    {item.affectedSymbols.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-white/[0.05] px-1 py-0.5 font-mono text-[9px] text-[#64748b]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <h3
                    className={cn(
                      'mb-1.5 text-sm font-semibold leading-tight',
                      item.sentiment === 'bullish'
                        ? 'text-emerald-200'
                        : item.sentiment === 'bearish'
                        ? 'text-red-200'
                        : 'text-[#EDEDEF]',
                    )}
                  >
                    {item.headline}
                  </h3>
                  <p className="text-xs text-[#8A8F98] leading-relaxed mb-2">{item.body}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: meta.color, opacity: 0.8 }}
                    >
                      ▸ {item.impact}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <style>{`
        @keyframes waveform {
          from { height: 4px; opacity: 0.4; }
          to { height: 14px; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
