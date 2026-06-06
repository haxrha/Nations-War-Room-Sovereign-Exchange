import { Crown } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { computeRankings, formatMoney, getCountry, botStrategyLabel, idStr } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { cn } from '../../lib/cn'

const MEDAL = ['🥇', '🥈', '🥉']

export function Leaderboard() {
  const { countries, playerCountryId } = useGame()
  const rankings = computeRankings(countries)

  return (
    <Panel title="Leaderboard" subtitle="GDP score ranking" label="Rankings" spotlight>
      <div className="scroll-subtle min-h-0 flex-1 overflow-y-auto p-3">
        {rankings.map((entry, i) => {
          const country = getCountry(entry.countryId, countries)
          if (!country) return null
          const isPlayer = playerCountryId != null && entry.countryId === playerCountryId

          return (
            <div
              key={idStr(entry.countryId)}
              className={cn(
                'mb-2 flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5',
                isPlayer
                  ? 'border-[#5E6AD2]/30 bg-[#5E6AD2]/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
              )}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center text-lg">
                {i < 3 ? MEDAL[i] : (
                  <span className="font-mono-label text-xs text-[#8A8F98]">#{entry.rank}</span>
                )}
              </span>
              <span className="text-xl">{country.flag}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate text-sm font-semibold">
                  {country.name}
                  {isPlayer && (
                    <Crown className="h-3.5 w-3.5 shrink-0 text-[#5E6AD2]" strokeWidth={2} />
                  )}
                </div>
                <div className="text-[10px] text-[#8A8F98]">
                  {country.isBot
                    ? botStrategyLabel(country.botStrategy)
                    : 'Human player'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[#5E6AD2]">
                  {formatMoney(entry.gdpScore, true)}
                </div>
                <div className="text-[10px] text-[#8A8F98]">
                  {formatMoney(country.balance, true)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
