import { Crown, Trophy } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { computeRankings, formatMoney, getCountry } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { accentAt } from '../../lib/design-system'
import { cn } from '../../lib/cn'

const MEDAL = ['🥇', '🥈', '🥉']

export function Leaderboard() {
  const { state } = useGame()
  const rankings = computeRankings(state)
  const playerId = state.playerCountryId

  return (
    <Panel title="Leaderboard" subtitle="Live GDP proxy score" accentIndex={4} emoji="🏆"
      headerExtra={<Trophy className="h-5 w-5 animate-wiggle text-[#FFE600]" strokeWidth={3} aria-hidden="true" />}>
      <div className="scroll-max min-h-0 flex-1 overflow-y-auto p-2">
        {rankings.map((entry, i) => {
          const country = getCountry(entry.countryId, state.countries)
          if (!country) return null
          const isPlayer = entry.countryId === playerId
          const accent = accentAt(i)
          const border = accentAt(i + 2)
          return (
            <div key={entry.countryId} className={cn('mb-2 flex items-center gap-3 rounded-2xl border-4 p-3 transition-all hover:-translate-y-1 hover:scale-[1.02]', i % 2 === 1 && 'translate-x-1')}
              style={{ borderColor: border, borderStyle: i % 3 === 0 ? 'dashed' : 'solid', backgroundColor: isPlayer ? `${accentAt(0)}25` : `${accent}15`, boxShadow: isPlayer ? `0 0 24px ${accentAt(0)}66, 8px 8px 0 ${accent}` : `4px 4px 0 ${accent}`, transform: i % 2 === 0 ? 'rotate(0.5deg)' : 'rotate(-0.5deg)' }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center font-display text-xl">
                {i < 3 ? MEDAL[i] : <span className="font-heading text-sm font-black text-white/60">#{entry.rank}</span>}
              </span>
              <span className="text-2xl">{country.flag}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate font-heading text-sm font-black uppercase">
                  {country.name}{isPlayer && <Crown className="h-4 w-4 shrink-0 text-[#FFE600]" strokeWidth={3} />}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-white/45">
                  {country.isBot ? `🤖 ${country.personality.replace(/_/g, ' ')}` : '🎮 Human player'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-sm font-black text-shadow-single" style={{ color: accent }}>{formatMoney(entry.gdpProxy, true)}</div>
                <div className="text-[9px] font-bold text-white/40">{formatMoney(country.balance, true)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
