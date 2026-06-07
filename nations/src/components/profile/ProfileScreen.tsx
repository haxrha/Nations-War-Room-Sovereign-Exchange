import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  Sparkles,
  Loader2,
  RefreshCw,
  Wallet,
  Landmark,
  TrendingUp,
  Package,
  Trophy,
} from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { buildProfileAnalyticsRequest } from '../../lib/buildProfileContext'
import { fetchProfileAnalytics } from '../../lib/profile-analytics-api'
import type { ProfileAnalytics } from '../../lib/profile-analytics-types'
import {
  formatMoney,
  formatPrice,
  formatQty,
  commodityAccent,
} from '../../lib/utils'
import { StatPill } from '../ui/Panel'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

const ACTION_STYLES = {
  buy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  sell: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  hold: 'border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf]',
  watch: 'border-white/10 bg-white/[0.04] text-[#94a3b8]',
} as const

const SENTIMENT_STYLES = {
  positive: 'text-emerald-400',
  neutral: 'text-[#94a3b8]',
  negative: 'text-red-400',
} as const

export function ProfileScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGame()
  const profile = useMemo(() => buildProfileAnalyticsRequest(game), [game])
  const profileRef = useRef(profile)
  profileRef.current = profile

  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    const current = profileRef.current
    if (!current) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchProfileAnalytics(current)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setAnalytics(result.analytics)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !profile) return
    void loadAnalytics()
  }, [open, profile?.player.name, loadAnalytics])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[800] flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="flex h-full w-full max-w-lg flex-col border-l border-[#1a9e75]/20 bg-[#0a0e1a]/98 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#1a9e75]/15 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-3xl">{profile?.player.flag ?? '🏳️'}</span>
            <div className="min-w-0">
              <h2 id="profile-title" className="truncate text-lg font-semibold text-[#f1f5f9]">
                {profile?.player.name ?? 'Your nation'}
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
                {profile?.player.isoCode ?? '—'} · {profile?.player.region ?? 'Profile'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748b] transition-colors hover:bg-white/[0.06] hover:text-[#f1f5f9]"
            aria-label="Close profile"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto">
          {!profile ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
              <p className="text-sm text-[#8A8F98]">
                Connect to the game and wait for your nation to register.
              </p>
            </div>
          ) : (
            <>
              {/* Net worth summary */}
              <div className="border-b border-[#1a9e75]/10 p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#64748b]">
                  Net worth
                </div>
                <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-[#2dd4bf]">
                  {formatMoney(profile.netWorth, true)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <StatPill
                    label="Cash"
                    value={formatMoney(profile.cashBalance, true)}
                    hint={`${((profile.cashBalance / Math.max(profile.netWorth, 1)) * 100).toFixed(0)}% of net worth`}
                  />
                  <StatPill
                    label="Holdings"
                    value={formatMoney(profile.holdingsValue, true)}
                    hint="Mark-to-market at spot"
                  />
                  <StatPill label="GDP score" value={formatMoney(profile.gdpScore, true)} />
                  <StatPill
                    label="Global rank"
                    value={`#${profile.globalRank} / ${profile.totalNations}`}
                    hint="By GDP score"
                  />
                </div>
              </div>

              {/* Commodities */}
              <div className="border-b border-[#1a9e75]/10 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#2dd4bf]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
                    Commodity holdings
                  </span>
                </div>
                <div className="space-y-2">
                  {profile.holdings.map((h) => {
                    const accent = commodityAccent(
                      game.commodities.find((c) => c.symbol === h.symbol),
                    )
                    return (
                      <div
                        key={h.symbol}
                        className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-bold"
                            style={{ borderColor: `${accent}40`, color: accent }}
                          >
                            {h.symbol}
                          </span>
                          <div>
                            <div className="text-sm text-[#f1f5f9]">{h.name}</div>
                            <div className="font-mono text-[10px] text-[#64748b]">
                              {formatQty(h.qty)} {h.unit}
                              {h.productionRate > 0 && ` · +${formatQty(h.productionRate)}/tick`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold tabular-nums text-[#f1f5f9]">
                            {formatMoney(h.marketValue, true)}
                          </div>
                          <div className="font-mono text-[10px] text-[#64748b]">
                            @ {formatPrice(h.spotPrice)} · {h.pctOfPortfolio.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Gemini analytics */}
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#2dd4bf]" />
                    <div>
                      <div className="text-sm font-semibold text-[#f1f5f9]">Trading intelligence</div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
                        Powered by Gemini
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void loadAnalytics()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Refresh
                  </Button>
                </div>

                {loading && !analytics && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#1a9e75]/15 bg-[#0f1729]/60 p-4 text-sm text-[#94a3b8]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#2dd4bf]" />
                    Building your trading dashboard…
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-950/30 p-4 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {analytics && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#1a9e75]/20 bg-[#0f1729]/80 p-4">
                      <p className="text-sm font-semibold text-[#2dd4bf]">{analytics.headline}</p>
                      <p className="mt-2 text-xs leading-relaxed text-[#cbd5e1]">{analytics.summary}</p>
                    </div>

                    {analytics.metrics.length > 0 && (
                      <div>
                        <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
                          Key metrics
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {analytics.metrics.map((m) => (
                            <div
                              key={m.label}
                              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                            >
                              <div className="font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
                                {m.label}
                              </div>
                              <div
                                className={cn(
                                  'mt-1 text-sm font-semibold tabular-nums',
                                  SENTIMENT_STYLES[m.sentiment],
                                )}
                              >
                                {m.value}
                              </div>
                              {m.hint && (
                                <div className="mt-0.5 text-[10px] text-[#64748b]">{m.hint}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analytics.opportunities.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
                          <TrendingUp className="h-3 w-3" />
                          Opportunities
                        </div>
                        <ul className="space-y-2">
                          {analytics.opportunities.map((o, i) => (
                            <li
                              key={`${o.commodity}-${i}`}
                              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#f1f5f9]">
                                  {o.commodity}
                                </span>
                                <span
                                  className={cn(
                                    'rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                                    ACTION_STYLES[o.action],
                                  )}
                                >
                                  {o.action}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[11px] leading-relaxed text-[#94a3b8]">
                                {o.rationale}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analytics.risks.length > 0 && (
                      <div>
                        <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
                          Risks
                        </div>
                        <ul className="space-y-1 text-[11px] text-amber-400/90">
                          {analytics.risks.map((r) => (
                            <li key={r}>⚠ {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analytics.watchlist.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {analytics.watchlist.map((w) => (
                          <span
                            key={w}
                            className="rounded-full border border-[#1a9e75]/25 bg-[#1a9e75]/10 px-2.5 py-1 font-mono text-[10px] text-[#2dd4bf]"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {profile && (
          <div className="shrink-0 border-t border-[#1a9e75]/10 px-5 py-3">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#64748b]">
              <span className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                {formatMoney(profile.cashBalance)} liquid
              </span>
              <span className="flex items-center gap-1">
                <Landmark className="h-3 w-3" />
                {profile.myOpenOffersCount} open listings
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Rank #{profile.globalRank}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
