import { Globe, Zap } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { computeGdpProxy, computeRankings, formatMoney } from '../../lib/utils'
import { Select } from '../ui/Button'
import { Badge } from '../ui/Panel'
import { accentAt } from '../../lib/design-system'

export function Header() {
  const { state, setPlayerCountry, now } = useGame()
  const player = state.countries.find((c) => c.id === state.playerCountryId)
  const gdp = player ? computeGdpProxy(player.id, state) : 0
  const rank = computeRankings(state).find((r) => r.countryId === state.playerCountryId)?.rank

  return (
    <header className="relative z-50 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b-4 border-dashed px-4 py-3 md:px-6"
      style={{ borderColor: accentAt(0), background: 'linear-gradient(135deg, rgba(45,27,78,0.95), rgba(13,13,26,0.98))', boxShadow: '0 8px 32px rgba(255,58,242,0.25), 0 4px 0 #FFE600' }}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#FFE600] glow-accent-lg"
          style={{ background: 'linear-gradient(135deg, #FF3AF2, #7B2FFF)' }}>
          <Globe className="h-6 w-6 text-white" strokeWidth={3} />
        </div>
        <div>
          <h1 className="font-heading text-xl font-black uppercase tracking-tight text-shadow-double md:text-2xl">
            <span className="gradient-text">Nations</span>
          </h1>
          <p className="font-body text-[10px] font-bold uppercase tracking-widest text-white/60">Sovereign Trade Exchange</p>
        </div>
        <Badge color={accentAt(2)} dashed>
          <span className="live-dot mr-1.5 inline-block h-2 w-2 rounded-full bg-[#34d399]" />
          LIVE · tick #{state.tickCount}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:gap-5">
        {state.lastBotAction && (
          <div className="hidden max-w-sm items-center gap-2 rounded-full border-4 border-dotted px-3 py-1 md:flex"
            style={{ borderColor: accentAt(3), backgroundColor: `${accentAt(3)}15` }}>
            <Zap className="h-4 w-4 shrink-0" style={{ color: accentAt(3) }} strokeWidth={3} />
            <span className="truncate font-body text-[10px] font-medium text-white/80">{state.lastBotAction}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-heading text-[10px] font-black uppercase tracking-widest text-[#00F5D4]">You are</span>
          <Select accentIndex={1} value={state.playerCountryId} onChange={(e) => setPlayerCountry(e.target.value)} className="min-w-[160px]">
            {state.countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </Select>
        </div>
        <div className="rounded-2xl border-4 px-4 py-2 text-right transition-transform hover:scale-105"
          style={{ borderColor: accentAt(4), backgroundColor: `${accentAt(4)}18`, boxShadow: `6px 6px 0 ${accentAt(0)}` }}>
          <div className="font-heading text-lg font-black text-shadow-single md:text-xl">GDP {formatMoney(gdp, true)}</div>
          <div className="font-body text-[10px] font-bold uppercase tracking-wider text-white/50">Rank #{rank} · {new Date(now).toLocaleTimeString()}</div>
        </div>
      </div>
    </header>
  )
}
